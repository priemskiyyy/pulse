import fc from "fast-check";
import { expect, test, vi } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import { Pulse } from "src/utils/Pulse";

type Step = { phase: string; interaction: string; time: number | null };

// Weighted toward known phases, which is where edges, pairs and duplicates happen.
const VALID = [
  ["foreground", "available"],
  ["foreground", "available"],
  ["foreground", "unavailable"],
  ["foreground", "unknown"],
  ["background", "unavailable"],
  ["background", "unavailable"],
  ["background", "unavailable"],
  ["unknown", "available"],
  ["unknown", "unavailable"],
  ["unknown", "unknown"],
];

const INVALID = [
  ["background", "available"],
  ["background", "unknown"],
  ["active", "available"],
];

const PROPERTY_OPTIONS = { seed: 20_260_927, numRuns: 500 };

const pairArbitrary = fc.oneof(
  { weight: 12, arbitrary: fc.constantFrom(...VALID) },
  { weight: 1, arbitrary: fc.constantFrom(...INVALID) },
);

// Mostly forward time, with failures and rollbacks often enough to matter.
const timeArbitrary = fc.oneof(
  { weight: 8, arbitrary: fc.integer({ min: 0, max: 20_000 }) },
  { weight: 1, arbitrary: fc.constant(null) },
);

const stepArbitrary = fc
  .tuple(pairArbitrary, timeArbitrary)
  .map(([[phase = "unknown", interaction = "unknown"], time]): Step => ({
    phase,
    interaction,
    time,
  }));

// Written for clarity, not speed: the rules of sections 9 to 11, one step at a time.
const runOracle = (steps: Step[]) => {
  const log: string[] = [];
  let current = "unknown/unknown";
  let sequence = 0;
  let lastTime: number | null = null;
  let departure: number | null = null;

  for (const step of steps) {
    const valid =
      ["foreground", "background", "unknown"].includes(step.phase) &&
      !(step.phase === "background" && step.interaction !== "unavailable");

    const next = valid
      ? `${step.phase}/${step.interaction}`
      : "unknown/unknown";

    const rolledBack =
      step.time !== null && lastTime !== null && step.time < lastTime;

    const usableTime = step.time !== null && !rolledBack ? step.time : null;

    if (usableTime === null) {
      departure = null;
    }

    if (step.time !== null) {
      lastTime = step.time;
    }

    if (next === current) {
      continue;
    }

    sequence += 1;
    log.push(`state ${next}`);

    const fromPhase = current.split("/")[0];
    const toPhase = next.split("/")[0];

    current = next;

    if (fromPhase === "foreground" && toPhase === "background") {
      log.push(`background #${sequence} at ${String(step.time)}`);
      departure = usableTime;
      continue;
    }

    if (fromPhase === "background" && toPhase === "foreground") {
      const away =
        departure === null || usableTime === null
          ? null
          : usableTime - departure;

      log.push(
        `foreground #${sequence} at ${String(step.time)} away ${String(away)}`,
      );
      departure = null;
      continue;
    }

    departure = null;
  }

  return log;
};

const runPulse = (steps: Step[]) => {
  const mock = createMockAdapter();
  let time: number | null = null;
  const log: string[] = [];

  const pulse = new Pulse({
    adapter: mock.adapter,
    now: () => {
      if (time === null) {
        throw new Error("clock failed");
      }

      return time;
    },
    onError: () => {},
  });

  pulse.state.subscribe(() => {
    const { phase, interaction } = pulse.state.get();

    log.push(`state ${phase}/${interaction}`);
  });
  pulse.on("background", (event) => {
    log.push(`background #${event.sequence} at ${String(event.observedAt)}`);
  });
  pulse.on("foreground", (event) => {
    log.push(
      `foreground #${event.sequence} at ${String(event.observedAt)} away ${String(event.observedAway)}`,
    );
  });

  time = 0;
  pulse.start();

  for (const step of steps) {
    time = step.time;

    const state = { phase: step.phase, interaction: step.interaction };

    // @ts-expect-error The generated steps include values outside the contract.
    mock.emit(state);
  }

  pulse.dispose();

  return log;
};

test("the runtime agrees with an independent oracle on generated traces", () => {
  fc.assert(
    fc.property(
      fc.array(stepArbitrary, { maxLength: 40, size: "medium" }),
      (steps) => {
        expect(runPulse(steps)).toEqual(runOracle(steps));
      },
    ),
    PROPERTY_OPTIONS,
  );
});

test("a second passive subscriber never changes how often the adapter is observed", () => {
  fc.assert(
    fc.property(
      fc.array(stepArbitrary, { maxLength: 12 }),
      fc.boolean(),
      (steps, extra) => {
        const mock = createMockAdapter();
        const pulse = new Pulse({ adapter: mock.adapter, onError: () => {} });

        pulse.state.subscribe(() => {});

        if (extra) {
          pulse.state.subscribe(() => {});
          pulse.on("foreground", () => {});
        }

        pulse.start();

        for (const { phase, interaction } of steps) {
          const state = { phase, interaction };

          // @ts-expect-error The generated steps include values outside the contract.
          mock.emit(state);
        }

        expect(mock.stats()).toEqual({
          observationsStarted: 1,
          observationsClosed: 0,
          activeObservations: 1,
        });
        pulse.dispose();
      },
    ),
    PROPERTY_OPTIONS,
  );
});

test("disposal never increases the number of later callbacks", () => {
  fc.assert(
    fc.property(fc.array(stepArbitrary, { maxLength: 12 }), (steps) => {
      const mock = createMockAdapter();
      const listener = vi.fn();

      const pulse = new Pulse({
        adapter: mock.adapter,
        onError: listener,
        onDiagnostic: listener,
      });

      pulse.state.subscribe(listener);
      pulse.on("foreground", listener);
      pulse.on("background", listener);
      pulse.start();
      pulse.dispose();
      listener.mockClear();

      for (const { phase, interaction } of steps) {
        const state = { phase, interaction };

        // @ts-expect-error The generated steps include values outside the contract.
        mock.unsafe.emitAfterCleanup(state);
      }

      expect(listener).not.toHaveBeenCalled();
    }),
    PROPERTY_OPTIONS,
  );
});
