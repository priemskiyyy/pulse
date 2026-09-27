import type { LifecycleState } from "src/types/LifecycleState";
import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";
import { PulseError } from "src/utils/PulseError";

// Reading each field once copies the snapshot into its interned state, so the
// adapter's object is never kept. The flat type allows one combination the
// contract forbids: background with any interaction but unavailable.
export const readObservation = ({ phase, interaction }: LifecycleState) => {
  const state = LIFECYCLE_STATES[phase][interaction];

  if (state === null) {
    return {
      state: UNKNOWN_LIFECYCLE_STATE,
      error: new PulseError({
        code: "INVALID_OBSERVATION",
        message:
          "The adapter reported background with an interaction other than unavailable.",
      }),
    };
  }

  return { state, error: null };
};
