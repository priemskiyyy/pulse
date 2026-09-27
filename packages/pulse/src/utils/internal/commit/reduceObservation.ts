import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { Timeline } from "src/types/internal/Timeline";
import type { BackgroundState } from "src/types/internal/BackgroundState";
import type { ForegroundState } from "src/types/internal/ForegroundState";
import type { LifecycleState } from "src/types/LifecycleState";

type Observation = { state: LifecycleState; timestamp: number | null };

// The flat state type does not narrow on its phase, so the event payloads need these.
const isForegroundState = (state: LifecycleState): state is ForegroundState =>
  state.phase === "foreground";

const isBackgroundState = (state: LifecycleState): state is BackgroundState =>
  state.phase === "background" && state.interaction === "unavailable";

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
    const away = departure === null || !usable ? null : timestamp - departure;

    const event: ForegroundEvent = Object.freeze({
      type: "foreground",
      sequence,
      from,
      to: state,
      observedAt: timestamp,
      // A usable entry never precedes its departure, but two finite extremes can overflow.
      observedAway: away !== null && Number.isFinite(away) ? away : null,
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
