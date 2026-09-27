import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { Timeline } from "src/types/internal/Timeline";
import type { LifecycleState } from "src/types/LifecycleState";
import { isBackgroundState } from "src/utils/internal/state/isBackgroundState";
import { isForegroundState } from "src/utils/internal/state/isForegroundState";

type Observation = { state: LifecycleState; timestamp: number | null };

const getObservedAway = (departure: number | null, entry: number | null) => {
  if (departure === null || entry === null) {
    return null;
  }

  const away = entry - departure;

  // A usable entry never precedes its departure, but two finite extremes can overflow.
  return Number.isFinite(away) ? away : null;
};

export const reduceObservation = (
  timeline: Timeline,
  { state, timestamp }: Observation,
) => {
  const rolledBack =
    timestamp !== null &&
    timeline.lastSample !== null &&
    timestamp < timeline.lastSample;

  const usable = timestamp !== null && !rolledBack;
  const lastSample = timestamp === null ? timeline.lastSample : timestamp;
  // The clock is checked before duplicates: a duplicate can reveal a discontinuity.
  const departure = usable ? timeline.departure : null;

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
        departure: usable ? timestamp : null,
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
      observedAway: getObservedAway(departure, usable ? timestamp : null),
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
