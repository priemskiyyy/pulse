import { afterEach, expect, test, vi } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import { createTestClock } from "src/testing/createTestClock";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { PulseErrorContext } from "src/types/PulseErrorContext";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";
import {
  BACKGROUND,
  FOREGROUND,
  recordDelivery,
} from "src/utils/Pulse.fixture";

afterEach(() => {
  vi.restoreAllMocks();
});

const createReported = (options: { now?: () => number } = {}) => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const reports: Array<[unknown, PulseErrorContext]> = [];

  const pulse = new Pulse({
    adapter: mock.adapter,
    onError: (error, context) => reports.push([error, context]),
    ...options,
  });

  pulse.start();

  return { mock, pulse, reports };
};

test("C-043 a background that claims interaction is published as unknown and reported, without throwing into the host", () => {
  const { mock, pulse, reports } = createReported();
  const log = recordDelivery(pulse);

  // The flat type allows this combination; the runtime contract does not.
  expect(() =>
    mock.emit({ phase: "background", interaction: "available" }),
  ).not.toThrow();

  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(log).toEqual(["state unknown/unknown"]);
  expect(reports).toEqual([
    [
      expect.objectContaining({ code: "INVALID_OBSERVATION" }),
      { origin: "observation", adapter: { name: "mock" }, sequence: 2 },
    ],
  ]);
});

test("C-050 a clock rollback delivers the edge and is reported once per anomaly", () => {
  const clock = createTestClock(1_000);
  const { mock, pulse, reports } = createReported({ now: clock.now });
  const events: ForegroundEvent[] = [];

  pulse.on("foreground", (event) => events.push(event));
  clock.set(2_000);
  mock.emit(BACKGROUND);
  clock.set(1_500);
  mock.emit(FOREGROUND);

  expect(events).toMatchObject([{ observedAt: 1_500, observedAway: null }]);
  expect(reports).toEqual([
    [
      expect.objectContaining({ code: "INVALID_CLOCK" }),
      { origin: "clock", adapter: { name: "mock" }, sequence: 3 },
    ],
  ]);
});

test("C-052 C-053 a throwing or NaN clock keeps the state and loses only the time", () => {
  const failure = new Error("clock failed");
  let answer: () => number = () => NaN;

  const { mock, pulse, reports } = createReported({ now: () => answer() });
  const events: ForegroundEvent[] = [];

  pulse.on("foreground", (event) => events.push(event));

  answer = () => {
    throw failure;
  };

  mock.emit(BACKGROUND);
  answer = () => 5_000;
  mock.emit(FOREGROUND);

  expect(events).toMatchObject([{ observedAt: 5_000, observedAway: null }]);
  expect(reports.map(([error, context]) => [error, context.origin])).toEqual([
    [expect.objectContaining({ code: "INVALID_CLOCK" }), "clock"],
    [
      expect.objectContaining({ code: "INVALID_CLOCK", cause: failure }),
      "clock",
    ],
  ]);
});

test("C-062 a throwing listener cannot stop the others, and is reported after them", () => {
  const { mock, pulse, reports } = createReported();
  const order: string[] = [];
  const failure = new Error("state listener failed");
  const eventFailure = "not an Error";

  pulse.state.subscribe(() => {
    order.push("first");
    throw failure;
  });
  pulse.state.subscribe(() => order.push("second"));
  pulse.on("background", () => {
    order.push("event");
    throw eventFailure;
  });
  pulse.on("background", () => order.push("second event"));

  const originalPush = reports.push.bind(reports);

  vi.spyOn(reports, "push").mockImplementation((...items) => {
    order.push("reported");

    return originalPush(...items);
  });

  mock.emit(BACKGROUND);

  expect(order).toEqual([
    "first",
    "second",
    "event",
    "second event",
    "reported",
    "reported",
  ]);
  expect(reports).toEqual([
    [
      failure,
      { origin: "state-listener", adapter: { name: "mock" }, sequence: 2 },
    ],
    [
      eventFailure,
      { origin: "transition-listener", adapter: { name: "mock" }, sequence: 2 },
    ],
  ]);
  expect(Object.isFrozen(reports[0]?.[1])).toBe(true);
});

test("C-065 a throwing diagnostic is reported once, with no diagnostic about it", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const failure = new Error("diagnostic failed");
  const onError = vi.fn();

  const onDiagnostic = vi.fn(() => {
    throw failure;
  });

  const pulse = new Pulse({ adapter: mock.adapter, onError, onDiagnostic });

  pulse.start();

  expect(onDiagnostic).toHaveBeenCalledTimes(2);
  expect(onError.mock.calls).toEqual([
    [failure, { origin: "diagnostic", adapter: { name: "mock" }, sequence: 0 }],
    [failure, { origin: "diagnostic", adapter: { name: "mock" }, sequence: 1 }],
  ]);
});

test("C-066 a throwing onError goes to the console and breaks no later delivery", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const listener = vi.fn();

  const onError = vi.fn(() => {
    throw new Error("reporter failed");
  });

  const pulse = new Pulse({ adapter: mock.adapter, onError });

  pulse.start();
  pulse.state.subscribe(() => {
    listener();
    throw new Error("listener failed");
  });
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);

  expect(listener).toHaveBeenCalledTimes(2);
  expect(onError).toHaveBeenCalledTimes(2);
  expect(consoleError).toHaveBeenCalledTimes(2);
});

test("without onError, an error reaches the console and delivery goes on", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const pulse = new Pulse({ adapter: mock.adapter });
  const failure = new Error("listener failed");
  const after = vi.fn();

  pulse.start();
  pulse.state.subscribe(() => {
    throw failure;
  });
  pulse.state.subscribe(after);
  mock.emit(BACKGROUND);

  expect(after).toHaveBeenCalledTimes(1);
  expect(consoleError.mock.calls).toEqual([
    ["Pulse: state-listener error", failure],
  ]);
});

test("C-067 an adapter error is reported in order and changes no state", () => {
  const { mock, pulse, reports } = createReported();
  const snapshot = pulse.state.get();
  const failure = new Error("focus getter failed");
  const listener = vi.fn();

  pulse.state.subscribe(listener);
  mock.error(failure);

  expect(pulse.state.get()).toBe(snapshot);
  expect(listener).not.toHaveBeenCalled();
  expect(reports).toEqual([
    [failure, { origin: "adapter", adapter: { name: "mock" }, sequence: 1 }],
  ]);
});
