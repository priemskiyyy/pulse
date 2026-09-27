import { expect, test, vi } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import { createTestClock } from "src/testing/createTestClock";
import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { LifecycleState } from "src/types/LifecycleState";
import { Pulse } from "src/utils/Pulse";
import {
  BACKGROUND,
  createCapturingAdapter,
  FOREGROUND,
  FOREGROUND_UNAVAILABLE,
  recordDelivery,
  UNKNOWN,
} from "src/utils/Pulse.fixture";

const createStarted = (initial?: LifecycleState) => {
  const mock = createMockAdapter(initial === undefined ? {} : { initial });
  const clock = createTestClock(1_000);
  const pulse = new Pulse({ adapter: mock.adapter, now: clock.now });
  const log = recordDelivery(pulse);

  pulse.start();

  return { mock, clock, pulse, log };
};

test("C-024 initial discovery of foreground commits without a foreground event", () => {
  const { log } = createStarted(FOREGROUND);

  expect(log).toEqual(["state foreground/available"]);
});

test("C-025 initial discovery of background commits without a background event", () => {
  const { log } = createStarted(BACKGROUND);

  expect(log).toEqual(["state background/unavailable"]);
});

test("C-026 a background baseline, then foreground, is one event with no duration", () => {
  const { mock, pulse } = createStarted(BACKGROUND);
  const events: ForegroundEvent[] = [];

  pulse.on("foreground", (event) => events.push(event));
  mock.emit(FOREGROUND);

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ sequence: 2, observedAway: null });
});

test("C-027 a known departure is one background event with the exact snapshots", () => {
  const { mock, pulse, log } = createStarted(FOREGROUND);
  const before = pulse.state.get();
  const events: BackgroundEvent[] = [];

  pulse.on("background", (event) => events.push(event));
  mock.emit(BACKGROUND);

  expect(log).toEqual([
    "state foreground/available",
    "state background/unavailable",
    "background #2",
  ]);
  expect(events[0]?.from).toBe(before);
  expect(events[0]?.to).toBe(pulse.state.get());
});

test("C-028 an observed departure and entry pair their times", () => {
  const { mock, pulse, clock } = createStarted(FOREGROUND);
  const events: ForegroundEvent[] = [];

  pulse.on("foreground", (event) => events.push(event));
  clock.advance(1_000);
  mock.emit(BACKGROUND);
  clock.advance(4_500);
  mock.emit(FOREGROUND);

  expect(events).toEqual([
    {
      type: "foreground",
      sequence: 3,
      from: BACKGROUND,
      to: FOREGROUND,
      observedAt: 6_500,
      observedAway: 4_500,
    },
  ]);
});

test("C-029 a duplicate snapshot notifies nothing and keeps identity and sequence", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const onDiagnostic = vi.fn();
  const pulse = new Pulse({ adapter: mock.adapter, onDiagnostic });
  const log = recordDelivery(pulse);

  pulse.start();

  const snapshot = pulse.state.get();

  mock.emit({ phase: "foreground", interaction: "available" });
  mock.emit(FOREGROUND);

  expect(log).toEqual(["state foreground/available"]);
  expect(pulse.state.get()).toBe(snapshot);
  expect(onDiagnostic.mock.calls.map(([diagnostic]) => diagnostic)).toEqual([
    { type: "started", adapter: { name: "mock" } },
    {
      type: "commit",
      sequence: 1,
      from: UNKNOWN,
      to: FOREGROUND,
      observedAt: expect.any(Number),
      transition: null,
    },
    { type: "duplicate", sequence: 1, state: FOREGROUND },
    { type: "duplicate", sequence: 1, state: FOREGROUND },
  ]);
});

test("C-030 an interaction-only change commits state and is no transition", () => {
  const { mock, log } = createStarted(FOREGROUND);

  mock.emit(FOREGROUND_UNAVAILABLE);
  mock.emit(FOREGROUND);

  expect(log).toEqual([
    "state foreground/available",
    "state foreground/unavailable",
    "state foreground/available",
  ]);
});

test("C-031 a known interaction with an unknown phase is accepted as it is", () => {
  const { mock, pulse, log } = createStarted();

  mock.emit({ phase: "unknown", interaction: "available" });

  expect(pulse.state.get()).toEqual({
    phase: "unknown",
    interaction: "available",
  });
  expect(log).toEqual(["state unknown/available"]);
});

test("C-032 C-033 no edge crosses an unknown gap, in either direction", () => {
  const { mock, log } = createStarted(FOREGROUND);

  mock.emit(UNKNOWN);
  mock.emit(FOREGROUND);
  mock.emit(BACKGROUND);
  mock.emit(UNKNOWN);
  mock.emit(FOREGROUND);

  expect(log.filter((entry) => !entry.startsWith("state"))).toEqual([
    "background #4",
  ]);
});

test("C-034 unknown, then background, then foreground is an edge with no duration", () => {
  const { mock, pulse } = createStarted();
  const events: ForegroundEvent[] = [];

  pulse.on("foreground", (event) => events.push(event));
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);

  expect(events.map((event) => event.observedAway)).toEqual([null]);
});

test("C-035 a rapid foreground, background, foreground keeps both edges in order", () => {
  const { mock, log } = createStarted(FOREGROUND);

  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);

  expect(log).toEqual([
    "state foreground/available",
    "state background/unavailable",
    "background #2",
    "state foreground/available",
    "foreground #3",
  ]);
});

test("C-036 discovery and interaction commits advance the sequence without events", () => {
  const { mock, pulse } = createStarted();
  const sequences: number[] = [];

  pulse.on("background", (event) => sequences.push(event.sequence));
  pulse.on("foreground", (event) => sequences.push(event.sequence));
  mock.emit(FOREGROUND_UNAVAILABLE);
  mock.emit(FOREGROUND);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND_UNAVAILABLE);

  expect(sequences).toEqual([3, 4]);
});

test("C-037 each event is frozen and names its own edge", () => {
  const { mock, pulse } = createStarted(FOREGROUND);
  const events: Array<ForegroundEvent | BackgroundEvent> = [];

  pulse.on("background", (event) => events.push(event));
  pulse.on("foreground", (event) => events.push(event));
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND_UNAVAILABLE);

  expect(
    events.map((event) => [event.type, event.from.phase, event.to.phase]),
  ).toEqual([
    ["background", "foreground", "background"],
    ["foreground", "background", "foreground"],
  ]);
  expect(events.every((event) => Object.isFrozen(event))).toBe(true);
  expect(Reflect.set(events[0] ?? {}, "sequence", 99)).toBe(false);
});

test("C-038 a source mutating the object it delivered changes no snapshot", () => {
  const { mock, pulse } = createStarted();

  const source = {
    phase: "foreground",
    interaction: "available",
  } satisfies LifecycleState;

  mock.emit(source);
  Reflect.set(source, "phase", "background");

  expect(pulse.state.get()).toEqual(FOREGROUND);
});

test("C-039 an input queued during delivery keeps the values it had at intake", () => {
  const { adapter, getObserver } = createCapturingAdapter();
  const pulse = new Pulse({ adapter });

  const queued = {
    phase: "background",
    interaction: "unavailable",
  } satisfies LifecycleState;

  const states: LifecycleState[] = [];
  let sent = false;

  pulse.state.subscribe(() => {
    states.push(pulse.state.get());

    if (sent) {
      return;
    }

    sent = true;
    getObserver().next(queued);
    Reflect.set(queued, "phase", "unknown");
    Reflect.set(queued, "interaction", "available");
  });

  pulse.start();
  getObserver().next(FOREGROUND);

  expect(states).toEqual([FOREGROUND, BACKGROUND]);
});

test("C-040 current and earlier snapshots are frozen", () => {
  const { mock, pulse } = createStarted(FOREGROUND);
  const first = pulse.state.get();

  mock.emit(BACKGROUND);

  const second = pulse.state.get();

  expect(Reflect.set(first, "phase", "background")).toBe(false);
  expect(Reflect.set(second, "interaction", "available")).toBe(false);
  expect(first).toEqual(FOREGROUND);
  expect(second).toEqual(BACKGROUND);
});

test("iOS-style inactive interruptions change interaction, and only real phase changes are edges", () => {
  const { mock, log } = createStarted(FOREGROUND);

  mock.emit(FOREGROUND_UNAVAILABLE);
  mock.emit(FOREGROUND);
  mock.emit(FOREGROUND_UNAVAILABLE);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND_UNAVAILABLE);
  mock.emit(FOREGROUND);

  expect(log.filter((entry) => !entry.startsWith("state"))).toEqual([
    "background #5",
    "foreground #6",
  ]);
});
