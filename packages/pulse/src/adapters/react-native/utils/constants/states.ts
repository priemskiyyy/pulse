import type { AppStateClassification } from "src/adapters/react-native/types/internal/AppStateClassification";
import type { LifecycleState } from "src/types/LifecycleState";
import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";

/** The snapshot each classification publishes; `ACTIVE` depends on the platform and Android focus instead. */
export const CLASSIFICATION_STATES: Record<
  Exclude<AppStateClassification, "ACTIVE">,
  LifecycleState
> = Object.freeze({
  UNINITIALIZED: UNKNOWN_LIFECYCLE_STATE,
  INACTIVE: LIFECYCLE_STATES.foreground.unavailable,
  BACKGROUND: LIFECYCLE_STATES.background.unavailable,
  UNKNOWN: UNKNOWN_LIFECYCLE_STATE,
});
