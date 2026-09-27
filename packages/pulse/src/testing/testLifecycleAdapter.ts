import type { AdapterConformanceHarness } from "src/testing/types/AdapterConformanceHarness";
import type { AdapterConformanceReport } from "src/testing/types/AdapterConformanceReport";
import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { LifecycleState } from "src/types/LifecycleState";
import { readObservation } from "src/utils/internal/intake/readObservation";
import { Pulse } from "src/utils/Pulse";

type Check = {
  name: string;
  run: (harness: AdapterConformanceHarness) => Promise<void>;
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const describeState = ({ phase, interaction }: LifecycleState) =>
  `${phase}/${interaction}`;

// Every snapshot the adapter reports is checked on its way to the core.
const inspect = (adapter: LifecycleAdapter) => {
  const invalid: string[] = [];

  const inspected: LifecycleAdapter = {
    name: adapter.name,
    observe: (observer) =>
      adapter.observe({
        next: (state) => {
          const read = readObservation(state);

          if (read.error !== null) {
            invalid.push(read.error.message);
          }

          observer.next(state);
        },
        error: (error) => observer.error(error),
      }),
  };

  return { adapter: inspected, invalid };
};

const startPulse = (adapter: LifecycleAdapter) => {
  const pulse = new Pulse({ adapter, onError: () => {} });
  const events: Array<ForegroundEvent | BackgroundEvent> = [];

  pulse.on("foreground", (event) => events.push(event));
  pulse.on("background", (event) => events.push(event));
  pulse.start();

  return { pulse, events };
};

const expectPhase = (pulse: Pulse, expected: LifecycleState, when: string) => {
  const state = pulse.state.get();

  assert(
    state.phase === expected.phase &&
      (expected.phase !== "background" ||
        state.interaction === expected.interaction),
    `After ${when}, the adapter reported ${describeState(state)} instead of ${describeState(expected)}.`,
  );
};

const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "unknown",
};

const BACKGROUND: LifecycleState = {
  phase: "background",
  interaction: "unavailable",
};

const CHECKS: Check[] = [
  {
    name: "creates no host subscription before start",
    run: async (harness) => {
      const before = harness.subscriptionCount();
      let observed = 0;

      const pulse = new Pulse({
        adapter: {
          name: harness.adapter.name,
          observe: (observer) => {
            observed += 1;

            return harness.adapter.observe(observer);
          },
        },
      });

      pulse.state.subscribe(() => {});
      pulse.on("foreground", () => {});
      await harness.settle();
      pulse.dispose();

      assert(observed === 0, "Subscribing observed the adapter.");
      assert(
        harness.subscriptionCount() === before,
        "Constructing or subscribing installed a host subscription.",
      );
    },
  },
  {
    name: "reports a valid foreground baseline",
    run: async (harness) => {
      const { adapter, invalid } = inspect(harness.adapter);
      const { pulse, events } = startPulse(adapter);

      try {
        await harness.settle();
        expectPhase(pulse, FOREGROUND, "start in a foreground host");
        assert(events.length === 0, "The baseline produced a transition.");
        assert(invalid.length === 0, `Invalid snapshot: ${invalid.join(" ")}`);
      } finally {
        pulse.dispose();
      }
    },
  },
  {
    name: "maps background and foreground",
    run: async (harness) => {
      const { adapter, invalid } = inspect(harness.adapter);
      const { pulse, events } = startPulse(adapter);

      try {
        await harness.settle();
        await harness.background();
        await harness.settle();
        expectPhase(pulse, BACKGROUND, "the host entered background");
        await harness.foreground();
        await harness.settle();
        expectPhase(pulse, FOREGROUND, "the host returned to foreground");
        assert(
          events.map((event) => event.type).join(",") ===
            "background,foreground",
          `The transitions were [${events.map((event) => event.type).join(", ")}] instead of [background, foreground].`,
        );
        assert(invalid.length === 0, `Invalid snapshot: ${invalid.join(" ")}`);
      } finally {
        pulse.dispose();
      }
    },
  },
  {
    name: "removes every subscription when cleanup returns",
    run: async (harness) => {
      const before = harness.subscriptionCount();
      const { pulse } = startPulse(harness.adapter);

      await harness.settle();
      assert(
        harness.subscriptionCount() > before,
        "Starting installed no host subscription the harness can count.",
      );
      pulse.dispose();
      assert(
        harness.subscriptionCount() === before,
        "A host subscription remained once cleanup returned.",
      );
    },
  },
  {
    name: "keeps observations independent",
    run: async (harness) => {
      const before = harness.subscriptionCount();
      const first = startPulse(harness.adapter);
      const second = startPulse(harness.adapter);

      try {
        await harness.settle();
        first.pulse.dispose();
        assert(
          harness.subscriptionCount() > before,
          "Disposing one observation removed the other's subscriptions.",
        );
        await harness.background();
        await harness.settle();
        expectPhase(second.pulse, BACKGROUND, "the first observation closed");
      } finally {
        first.pulse.dispose();
        second.pulse.dispose();
      }

      assert(
        harness.subscriptionCount() === before,
        "A host subscription remained once both observations closed.",
      );
    },
  },
  {
    name: "cleans up idempotently",
    run: async (harness) => {
      const before = harness.subscriptionCount();

      const cleanup = harness.adapter.observe({
        next: () => {},
        error: () => {},
      });

      assert(
        typeof cleanup === "function",
        "observe() answered no cleanup function.",
      );
      cleanup();
      cleanup();
      await harness.settle();
      assert(
        harness.subscriptionCount() === before,
        "A repeated cleanup left or reinstalled a host subscription.",
      );
    },
  },
  {
    name: "stays silent after cleanup",
    run: async (harness) => {
      let lateCalls = 0;
      let closed = false;

      const handleCall = () => {
        if (closed) {
          lateCalls += 1;
        }
      };

      const observer: LifecycleObserver = {
        next: handleCall,
        error: handleCall,
      };

      const cleanup = harness.adapter.observe(observer);

      await harness.settle();
      cleanup();
      closed = true;
      await harness.background();
      await harness.foreground();
      await harness.settle();
      assert(lateCalls === 0, "The adapter called its observer after cleanup.");
    },
  },
];

/**
 * Runs the lifecycle adapter conformance checks against fresh harnesses, one
 * per check, and disposes every observation and host even when a check fails.
 * It needs no test runner: a failure throws one error naming every failed check.
 *
 * @example
 * ```ts
 * test("the custom adapter conforms", async () => {
 *   const report = await testLifecycleAdapter(() => createHostHarness());
 *
 *   expect(report.passed).toHaveLength(7);
 * });
 * ```
 */
export const testLifecycleAdapter = async (
  createHarness: () =>
    AdapterConformanceHarness | Promise<AdapterConformanceHarness>,
): Promise<AdapterConformanceReport> => {
  const passed: string[] = [];
  const failures: Array<{ name: string; error: unknown }> = [];

  for (const { name, run } of CHECKS) {
    let harness: AdapterConformanceHarness | null = null;

    try {
      harness = await createHarness();
      await run(harness);
      passed.push(name);
    } catch (error) {
      failures.push({ name, error });
    } finally {
      try {
        await harness?.disposeHost();
      } catch (error) {
        failures.push({ name: `${name}: disposing the host`, error });
      }
    }
  }

  if (failures.length > 0) {
    const details = failures.map(
      ({ name, error }) =>
        `- ${name}: ${error instanceof Error ? error.message : String(error)}`,
    );

    throw new Error(
      `Lifecycle adapter conformance failed:\n${details.join("\n")}`,
      { cause: failures[0]?.error },
    );
  }

  return Object.freeze({ passed });
};
