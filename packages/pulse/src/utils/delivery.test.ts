import { expect, test, vi } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import { createTestClock } from "src/testing/createTestClock";
import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { PulseDiagnostic } from "src/types/PulseDiagnostic";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";
import {
  BACKGROUND,
  createCapturingAdapter,
  FOREGROUND,
  FOREGROUND_UNAVAILABLE,
  recordDelivery,
} from "src/utils/Pulse.fixture";

test("C-046 reading and subscribing never sample the clock", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const now = vi.fn(() => 1_000);
  const pulse = new Pulse({ adapter: mock.adapter, now });

  pulse.start();
  now.mockClear();

  for (let index = 0; index < 5; index += 1) {
    pulse.state.get();
    pulse.state.subscribe(() => {})();
  }

  expect(now).not.toHaveBeenCalled();
  mock.emit(FOREGROUND);
  expect(now).toHaveBeenCalledTimes(1);
});

test("C-056 a slow listener does not move the time already captured at intake", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const clock = createTestClock(1_000);
  const pulse = new Pulse({ adapter: mock.adapter, now: clock.now });
  const events: Array<BackgroundEvent | ForegroundEvent> = [];

  pulse.start();
  pulse.state.subscribe(() => clock.advance(5_000));
  pulse.on("background", (event) => events.push(event));
  pulse.on("foreground", (event) => events.push(event));
  clock.set(2_000);
  mock.emit(BACKGROUND);
  clock.set(10_000);
  mock.emit(FOREGROUND);

  expect(events.map((event) => event.observedAt)).toEqual([2_000, 10_000]);
  expect(events[1]).toMatchObject({ observedAway: 8_000 });
});

test("C-057 a reentrant input keeps its own intake time while it waits", () => {
  const { adapter, getObserver } = createCapturingAdapter();
  const clock = createTestClock(1_000);
  const pulse = new Pulse({ adapter, now: clock.now });
  const events: ForegroundEvent[] = [];
  let sent = false;

  pulse.start();
  getObserver().next(FOREGROUND);
  clock.set(2_000);

  pulse.on("background", () => {
    if (sent) {
      return;
    }

    sent = true;
    clock.set(3_000);
    getObserver().next(FOREGROUND);
    clock.set(9_000);
  });

  pulse.on("foreground", (event) => events.push(event));
  getObserver().next(BACKGROUND);

  expect(events).toMatchObject([{ observedAt: 3_000, observedAway: 1_000 }]);
});

test("C-058 every callback of a commit reads that commit, even after a later input queued", () => {
  const { adapter, getObserver } = createCapturingAdapter();
  const pulse = new Pulse({ adapter });
  const reads: string[] = [];

  pulse.start();
  getObserver().next(FOREGROUND);

  pulse.state.subscribe(() => {
    reads.push(`first ${pulse.state.get().phase}`);

    if (pulse.state.get().phase === "background") {
      getObserver().next(FOREGROUND);
    }
  });

  pulse.state.subscribe(() => reads.push(`second ${pulse.state.get().phase}`));

  pulse.on("background", (event) => {
    reads.push(`event ${String(pulse.state.get() === event.to)}`);
  });

  getObserver().next(BACKGROUND);

  expect(reads).toEqual([
    "first background",
    "second background",
    "event true",
    "first foreground",
    "second foreground",
  ]);
});

test("C-059 an event listener added by a state listener starts with a later commit", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const late = vi.fn();

  pulse.start();

  const stop = pulse.state.subscribe(() => {
    pulse.on("background", late);
    pulse.on("foreground", late);
    stop();
  });

  mock.emit(BACKGROUND);
  expect(late).not.toHaveBeenCalled();

  mock.emit(FOREGROUND);
  expect(late).toHaveBeenCalledTimes(1);
});

test("C-060 a registration removed before its turn is skipped", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const removed = vi.fn();
  const removedEvent = vi.fn();

  pulse.start();
  pulse.state.subscribe(() => {
    stopState();
    stopEvent();
  });

  const stopState = pulse.state.subscribe(removed);
  const stopEvent = pulse.on("background", removedEvent);

  mock.emit(BACKGROUND);

  expect(removed).not.toHaveBeenCalled();
  expect(removedEvent).not.toHaveBeenCalled();
});

test("C-061 a function removed and added back does not get its old turn back", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const listener = vi.fn();
  let readded = false;

  pulse.start();
  pulse.state.subscribe(() => {
    if (readded) {
      return;
    }

    readded = true;
    stop();
    pulse.state.subscribe(listener);
  });

  const stop = pulse.state.subscribe(listener);

  mock.emit(BACKGROUND);
  expect(listener).not.toHaveBeenCalled();

  mock.emit(FOREGROUND);
  expect(listener).toHaveBeenCalledTimes(1);
});

test("state listeners run before transition listeners, whatever the registration order", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const order: string[] = [];

  pulse.start();
  pulse.on("background", () => order.push("event"));
  pulse.state.subscribe(() => order.push("state"));
  mock.emit(BACKGROUND);

  expect(order).toEqual(["state", "event"]);
});

test("C-063 an input sent from onError waits behind the current commit", () => {
  const { adapter, getObserver } = createCapturingAdapter();
  const order: string[] = [];
  let sent = false;

  const pulse = new Pulse({
    adapter,
    onError: () => {
      order.push("onError");

      if (sent) {
        return;
      }

      sent = true;
      getObserver().next(BACKGROUND);
      order.push("onError returned");
    },
    onDiagnostic: (diagnostic) => order.push(diagnostic.type),
  });

  pulse.state.subscribe(() => {
    order.push(`state ${pulse.state.get().phase}`);

    if (pulse.state.get().phase === "foreground") {
      throw new Error("listener failed");
    }
  });

  pulse.start();
  getObserver().next(FOREGROUND);

  expect(order).toEqual([
    "started",
    "state foreground",
    "onError",
    "onError returned",
    "commit",
    "state background",
    "commit",
  ]);
});

test("C-064 an input sent from a diagnostic cannot replace state recursively", () => {
  const { adapter, getObserver } = createCapturingAdapter((observer) => {
    observer.next(FOREGROUND);
  });

  const diagnostics: PulseDiagnostic[] = [];
  let sent = false;

  const pulse = new Pulse({
    adapter,
    onDiagnostic: (diagnostic) => {
      diagnostics.push(diagnostic);

      if (sent) {
        return;
      }

      sent = true;
      getObserver().next(FOREGROUND_UNAVAILABLE);
      expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
    },
  });

  pulse.start();

  expect(
    diagnostics.map((diagnostic) =>
      diagnostic.type === "commit"
        ? diagnostic.to.interaction
        : diagnostic.type,
    ),
  ).toEqual(["started", "available", "unavailable"]);
});

test("C-068 a dispose inside a callback silences the rest and drops queued input", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const onError = vi.fn();
  const onDiagnostic = vi.fn();
  const pulse = new Pulse({ adapter: mock.adapter, onError, onDiagnostic });
  const after = vi.fn();

  pulse.start();
  onDiagnostic.mockClear();

  pulse.state.subscribe(() => {
    mock.emit(FOREGROUND);
    pulse.dispose();
    throw new Error("thrown after dispose");
  });

  pulse.state.subscribe(after);
  pulse.on("background", after);
  mock.emit(BACKGROUND);

  expect(after).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
  expect(onDiagnostic).not.toHaveBeenCalled();
  expect(pulse.state.get()).toEqual(BACKGROUND);
  expect(mock.stats().activeObservations).toBe(0);
});

test("C-069 cleanup failures are reported during dispose, and its late emissions are ignored", () => {
  const failure = new Error("removal failed");
  const onError = vi.fn();

  const { adapter } = createCapturingAdapter((captured) => {
    captured.next(FOREGROUND);

    return () => {
      captured.next(BACKGROUND);
      pulse.dispose();
      throw failure;
    };
  });

  const pulse = new Pulse({ adapter, onError });
  const listener = vi.fn();

  pulse.start();
  pulse.state.subscribe(listener);
  pulse.dispose();

  expect(listener).not.toHaveBeenCalled();
  expect(pulse.state.get()).toEqual(FOREGROUND);
  expect(onError.mock.calls).toEqual([
    [
      failure,
      { origin: "cleanup", adapter: { name: "capturing" }, sequence: 1 },
    ],
  ]);
});

test("C-070 a hostile callback after dispose reaches no state, event, diagnostic or error callback", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const onError = vi.fn();
  const onDiagnostic = vi.fn();
  const pulse = new Pulse({ adapter: mock.adapter, onError, onDiagnostic });
  const listener = vi.fn();

  pulse.start();
  pulse.state.subscribe(listener);
  pulse.on("background", listener);
  pulse.dispose();
  onDiagnostic.mockClear();
  mock.unsafe.emitAfterCleanup(BACKGROUND);

  const nonsense = { phase: "nonsense", interaction: "unknown" };

  // @ts-expect-error A hostile adapter can report anything.
  mock.unsafe.emitAfterCleanup(nonsense);
  mock.unsafe.errorAfterCleanup(new Error("late"));

  expect(listener).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
  expect(onDiagnostic).not.toHaveBeenCalled();
  expect(pulse.state.get()).toEqual(FOREGROUND);
});

test("C-071 a new instance starts unknown at sequence zero with no departure carried over", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const clock = createTestClock(1_000);
  const first = new Pulse({ adapter: mock.adapter, now: clock.now });

  first.start();
  mock.emit(BACKGROUND);
  first.dispose();

  const second = new Pulse({ adapter: mock.adapter, now: clock.now });
  const log = recordDelivery(second);
  const entries: ForegroundEvent[] = [];

  second.on("foreground", (event) => entries.push(event));

  expect(second.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
  second.start();
  mock.emit(FOREGROUND);

  expect(log).toEqual([
    "state background/unavailable",
    "state foreground/available",
    "foreground #2",
  ]);
  expect(entries).toMatchObject([{ observedAway: null }]);
});

test("C-072 a listener's promise is not awaited, and delivery stays synchronous", async () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const order: string[] = [];
  const failure = new Error("async listener failed");
  let settled: Promise<void> = Promise.resolve();

  pulse.start();
  pulse.on("background", () => {
    settled = (async () => {
      order.push("async started");
      await null;
      order.push("async finished");
      throw failure;
    })();

    return settled;
  });

  pulse.on("background", () => order.push("next listener"));
  mock.emit(BACKGROUND);
  order.push("emit returned");

  expect(order).toEqual(["async started", "next listener", "emit returned"]);
  await expect(settled).rejects.toBe(failure);
});
