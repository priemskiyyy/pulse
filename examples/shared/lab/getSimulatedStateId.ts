import type { LifecycleState } from "@priemskiyyy/pulse";

import {
  SIMULATED_STATE_OPTIONS,
  SIMULATED_STATES,
} from "example-shared/lab/constants/simulatedStates";

/** Which simulated state a snapshot is, for the control to mark. */
export const getSimulatedStateId = ({ phase, interaction }: LifecycleState) =>
  SIMULATED_STATE_OPTIONS.find(({ value }) => {
    const state = SIMULATED_STATES[value];

    if (state.phase !== phase) {
      return false;
    }

    return state.interaction === interaction;
  })?.value ?? "unknown";
