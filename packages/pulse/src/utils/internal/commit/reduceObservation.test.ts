import fc from "fast-check";
import { expect, test } from "vitest";

import type { Timeline } from "src/types/internal/Timeline";
import type { LifecycleState } from "src/types/LifecycleState";
import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";
import { reduceObservation } from "src/utils/internal/commit/reduceObservation";

const F = LIFECYCLE_STATES.foreground.available;
const FU = LIFECYCLE_STATES.foreground.unavailable;
const B = LIFECYCLE_STATES.background.unavailable;
const U = UNKNOWN_LIFECYCLE_STATE;

const VALID_STATES = Object.values(LIFECYCLE_STATES).flatMap((row) =>
  Object.values(row).flatMap((state) => (state === null ? [] : [state])),
);

const INITIAL: Timeline = {
  state: UNKNOWN_LIFECYCLE_STATE,
  sequence: 0,
  lastSample: null,
  departure: null,
};

type Step = [state: LifecycleState, timestamp: number | null];

const run = (steps: Step[], timeline = INITIAL) =>
  steps.reduce(
    (result, [state, timestamp]) => {
      const next = reduceObservation(result.timeline, { state, timestamp });

      return {
        timeline: next.timeline,
        events:
          next.event === null ? result.events : [...result.events, next.event],
        commits: result.commits + (next.commit === null ? 0 : 1),
        rollbacks: result.rollbacks + (next.rolledBack ? 1 : 0),
      };
    },
    {
      timeline,
      events: new Array<
        NonNullable<ReturnType<typeof reduceObservation>["event"]>
      >(),
      commits: 0,
      rollbacks: 0,
    },
  );

const getForegroundDurations = (steps: Step[]) =>
  run(steps).events.flatMap((event) =>
    event.type === "foreground" ? [event.observedAway] : [],
  );

test("C-047 a departure at 2000 and an entry at 6500 are 4500 apart", () => {
  expect(
    getForegroundDurations([
      [F, 1_000],
      [B, 2_000],
      [F, 6_500],
    ]),
  ).toEqual([4_500]);
});

test("C-026 an initial background baseline enters foreground with no duration", () => {
  const { events } = run([
    [B, 2_000],
    [F, 6_500],
  ]);

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ type: "foreground", observedAway: null });
});

test("C-048 a duplicate background at 4000 does not move the departure at 2000", () => {
  expect(
    getForegroundDurations([
      [F, 1_000],
      [B, 2_000],
      [B, 4_000],
      [F, 6_500],
    ]),
  ).toEqual([4_500]);
});

test("C-033 no foreground event crosses an unknown phase", () => {
  const { events } = run([
    [F, 1_000],
    [B, 2_000],
    [U, 3_000],
    [F, 6_500],
  ]);

  expect(events.map((event) => event.type)).toEqual(["background"]);
});

test("C-034 a background after an unknown gap enters foreground with no duration", () => {
  expect(
    getForegroundDurations([
      [F, 1_000],
      [B, 2_000],
      [U, 3_000],
      [B, 4_000],
      [F, 6_500],
    ]),
  ).toEqual([null]);
});

test("C-049 an equal-time pair is zero, not unknown", () => {
  expect(
    getForegroundDurations([
      [F, 1_000],
      [B, 2_000],
      [F, 2_000],
    ]),
  ).toEqual([0]);
});

test("C-050 a clock rollback still delivers the edge, with no duration", () => {
  const result = run([
    [F, 1_000],
    [B, 2_000],
    [F, 1_500],
  ]);

  expect(result.events.map((event) => event.type)).toEqual([
    "background",
    "foreground",
  ]);
  expect(result.events[1]).toMatchObject({
    observedAt: 1_500,
    observedAway: null,
  });
  expect(result.rollbacks).toBe(1);
});

test("C-051 a rollback seen on a duplicate background invalidates the pair", () => {
  const result = run([
    [F, 1_000],
    [B, 2_000],
    [B, 1_000],
    [F, 6_500],
  ]);

  expect(
    getForegroundDurations([
      [F, 1_000],
      [B, 2_000],
      [B, 1_000],
      [F, 6_500],
    ]),
  ).toEqual([null]);
  expect(result.rollbacks).toBe(1);
  expect(result.commits).toBe(3);
});

test("C-052 a failed clock sample keeps the edge and loses only the timing", () => {
  const { events } = run([
    [F, 1_000],
    [B, null],
    [F, 6_500],
  ]);

  expect(events.map((event) => [event.type, event.observedAt])).toEqual([
    ["background", null],
    ["foreground", 6_500],
  ]);
  expect(events[1]).toMatchObject({ observedAway: null });
});

test("a failed sample while background invalidates an armed departure", () => {
  expect(
    getForegroundDurations([
      [F, 1_000],
      [B, 2_000],
      [B, null],
      [F, 6_500],
    ]),
  ).toEqual([null]);
});

test("C-054 a clean departure after a clock anomaly forms a new valid pair", () => {
  expect(
    getForegroundDurations([
      [F, 5_000],
      [B, 4_000],
      [F, 4_500],
      [B, 6_000],
      [F, 9_000],
    ]),
  ).toEqual([null, 3_000]);
});

test("a departure that itself rolls the clock back is not armed", () => {
  expect(
    getForegroundDurations([
      [F, 5_000],
      [B, 4_000],
      [F, 8_000],
    ]),
  ).toEqual([null]);
});

test("C-055 a large positive duration is not clamped", () => {
  expect(
    getForegroundDurations([
      [F, 0],
      [B, 1],
      [F, 1e15],
    ]),
  ).toEqual([1e15 - 1]);
});

test("C-071 a new timeline starts unknown at sequence zero with nothing to pair", () => {
  const first = run([
    [F, 1_000],
    [B, 2_000],
  ]);

  expect(first.timeline.departure).toBe(2_000);

  const second = run([[F, 6_500]]);

  expect(second.timeline).toEqual({
    state: F,
    sequence: 1,
    lastSample: 6_500,
    departure: null,
  });
  expect(second.events).toEqual([]);
});

test("C-024 C-025 initial discovery commits without an edge", () => {
  expect(run([[F, 0]])).toMatchObject({ commits: 1, events: [] });
  expect(run([[B, 0]])).toMatchObject({ commits: 1, events: [] });
});

test("C-053 a difference that overflows is no duration, never Infinity", () => {
  expect(
    getForegroundDurations([
      [F, -Number.MAX_VALUE],
      [B, -Number.MAX_VALUE],
      [F, Number.MAX_VALUE],
    ]),
  ).toEqual([null]);
});

test("C-030 an interaction-only change commits without an edge and keeps the pair", () => {
  const result = run([
    [F, 1_000],
    [FU, 1_500],
    [B, 2_000],
    [F, 6_500],
  ]);

  expect(result.commits).toBe(4);
  expect(result.events.map((event) => event.type)).toEqual([
    "background",
    "foreground",
  ]);
  expect(
    getForegroundDurations([
      [F, 1_000],
      [FU, 1_500],
      [B, 2_000],
      [F, 6_500],
    ]),
  ).toEqual([4_500]);
});

test("C-035 a rapid foreground, background, foreground keeps both edges", () => {
  const { events } = run([
    [F, 1_000],
    [B, 1_000],
    [F, 1_000],
  ]);

  expect(events.map((event) => [event.type, event.sequence])).toEqual([
    ["background", 2],
    ["foreground", 3],
  ]);
});

test("C-027 C-037 an edge references the exact snapshots and is frozen", () => {
  const { events } = run([
    [F, 1_000],
    [B, 2_000],
  ]);

  const [event] = events;

  expect(event).toEqual({
    type: "background",
    sequence: 2,
    from: F,
    to: B,
    observedAt: 2_000,
  });
  expect(event?.from).toBe(F);
  expect(event?.to).toBe(B);
  expect(Object.isFrozen(event)).toBe(true);
});

test("all 49 adjacent pairs commit, count and label edges exactly", () => {
  for (const from of VALID_STATES) {
    for (const to of VALID_STATES) {
      const timeline: Timeline = {
        state: from,
        sequence: 5,
        lastSample: 1_000,
        departure: from.phase === "background" ? 500 : null,
      };

      const next = reduceObservation(timeline, { state: to, timestamp: 2_000 });
      const changed = from !== to;

      const edge =
        from.phase === "foreground" && to.phase === "background"
          ? "background"
          : from.phase === "background" && to.phase === "foreground"
            ? "foreground"
            : null;

      expect(next.commit === null).toBe(!changed);
      expect(next.timeline.sequence).toBe(changed ? 6 : 5);
      expect(next.timeline.state).toBe(to);
      expect(next.event?.type ?? null).toBe(edge);

      if (next.event !== null) {
        expect(next.event.from).toBe(from);
        expect(next.event.to).toBe(to);
        expect(next.event.sequence).toBe(6);
      }
    }
  }
});

const stateArbitrary = fc.constantFrom(...VALID_STATES);

const stepArbitrary = fc.tuple(
  stateArbitrary,
  fc.option(fc.integer({ min: 0, max: 10_000 }), { nil: null }),
);

const PROPERTY_OPTIONS = { seed: 20_260_927, numRuns: 500 };

test("inserting an equal-state observation cannot add a phase edge", () => {
  fc.assert(
    fc.property(
      fc.array(stepArbitrary, { maxLength: 12 }),
      fc.nat(),
      (steps, at) => {
        const index = steps.length === 0 ? 0 : at % steps.length;
        const previous = steps[index - 1];

        if (previous === undefined) {
          return;
        }

        const withDuplicate: Step[] = [
          ...steps.slice(0, index),
          [previous[0], previous[1]],
          ...steps.slice(index),
        ];

        const edges = (trace: Step[]) =>
          run(trace).events.map((event) => [event.type, event.from, event.to]);

        expect(edges(withDuplicate)).toEqual(edges(steps));
      },
    ),
    PROPERTY_OPTIONS,
  );
});

test("an unknown phase between two observations prevents an edge across it", () => {
  fc.assert(
    fc.property(stepArbitrary, stepArbitrary, (before, after) => {
      const { events } = run([before, [U, before[1]], after]);

      expect(events).toEqual([]);
    }),
    PROPERTY_OPTIONS,
  );
});

test("with a nondecreasing clock, duplicates never change a paired duration", () => {
  fc.assert(
    fc.property(
      fc.array(fc.tuple(stateArbitrary, fc.integer({ min: 0, max: 1_000 })), {
        maxLength: 12,
      }),
      (raw) => {
        let time = 0;

        const steps: Step[] = raw.map(([state, delta]) => {
          time += delta;

          return [state, time];
        });

        const withDuplicates = steps.flatMap((step): Step[] => [step, step]);

        expect(getForegroundDurations(withDuplicates)).toEqual(
          getForegroundDurations(steps),
        );
        expect(run(withDuplicates).commits).toBe(run(steps).commits);
      },
    ),
    PROPERTY_OPTIONS,
  );
});

test("a duration is never negative or non-finite", () => {
  fc.assert(
    fc.property(fc.array(stepArbitrary, { maxLength: 16 }), (steps) => {
      for (const away of getForegroundDurations(steps)) {
        expect(away === null || (Number.isFinite(away) && away >= 0)).toBe(
          true,
        );
      }
    }),
    PROPERTY_OPTIONS,
  );
});
