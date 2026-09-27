import type { LifecycleState } from "src/types/LifecycleState";
import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";
import { PulseError } from "src/utils/PulseError";

// Each field is read once into its interned state, so the adapter's object is never kept.
export const readObservation = ({ phase, interaction }: LifecycleState) => {
  const state = LIFECYCLE_STATES[phase][interaction];

  // The flat type allows background with an interaction; the contract does not.
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
