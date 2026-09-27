import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { BackgroundState } from "src/types/internal/BackgroundState";
import type { ForegroundState } from "src/types/internal/ForegroundState";
import type { Intake } from "src/types/internal/Intake";
import type { Timeline } from "src/types/internal/Timeline";
import type { LifecycleState } from "src/types/LifecycleState";

type Observation = Pick<
  Extract<Intake, { kind: "observation" }>,
  "state" | "timestamp"
>;

// The flat state type does not narrow on its phase, so the event payloads need these.
const isForegroundState = (state: LifecycleState): state is ForegroundState =>
  state.phase === "foreground";

const isBackgroundState = (state: LifecycleState): state is BackgroundState => {
  if (state.phase !== "background") {
    return false;
  }

  return state.interaction === "unavailable";
};

// A sample earlier than the last one is a clock discontinuity, not elapsed time.
const isRolledBack = (timestamp: number | null, lastSample: number | null) => {
  if (timestamp === null) {
    return false;
  }

  if (lastSample === null) {
    return false;
  }

  return timestamp < lastSample;
};

const getObservedAway = (departure: number | null, entry: number | null) => {
  if (departure === null) {
    return null;
  }

  if (entry === null) {
    return null;
  }

  const away = entry - departure;

  // A usable entry never precedes its departure, but two finite extremes can overflow.
  if (!Number.isFinite(away)) {
    return null;
  }

  return away;
};

export const reduceObservation = (
  timeline: Timeline,
  { state, timestamp }: Observation,
) => {
  // The clock is checked before duplicates: a duplicate can reveal a discontinuity.
  const rolledBack = isRolledBack(timestamp, timeline.lastSample);
  // A failed or backward sample can time nothing.
  const usableTimestamp = rolledBack ? null : timestamp;
  const lastSample = timestamp === null ? timeline.lastSample : timestamp;
  const departure = usableTimestamp === null ? null : timeline.departure;

  if (state === timeline.state) {
    return {
      timeline: { ...timeline, lastSample, departure },
      commit: null,
      event: null,
      rolledBack,
    };
  }

  const from = timeline.state;
  const sequence = timeline.sequence + 1;
  const commit = { from, to: state };

  if (isForegroundState(from) && isBackgroundState(state)) {
    const event: BackgroundEvent = Object.freeze({
      type: "background",
      sequence,
      from,
      to: state,
      observedAt: timestamp,
    });

    return {
      timeline: {
        state,
        sequence,
        lastSample,
        departure: usableTimestamp,
      },
      commit,
      event,
      rolledBack,
    };
  }

  if (isBackgroundState(from) && isForegroundState(state)) {
    const event: ForegroundEvent = Object.freeze({
      type: "foreground",
      sequence,
      from,
      to: state,
      observedAt: timestamp,
      observedAway: getObservedAway(departure, usableTimestamp),
    });

    return {
      timeline: { state, sequence, lastSample, departure: null },
      commit,
      event,
      rolledBack,
    };
  }

  // Only background holds a departure, and its only other exit is an unknown phase.
  return {
    timeline: { state, sequence, lastSample, departure: null },
    commit,
    event: null,
    rolledBack,
  };
};
