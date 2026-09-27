import type { LifecycleState } from "src/types/LifecycleState";

/** iOS `active`. */
export const ACTIVE_STATE: LifecycleState = Object.freeze({
  phase: "foreground",
  interaction: "available",
});

/** iOS `inactive`: still foreground, but not taking input. */
export const INACTIVE_STATE: LifecycleState = Object.freeze({
  phase: "foreground",
  interaction: "unavailable",
});

/** `background` on either platform. */
export const BACKGROUND_STATE: LifecycleState = Object.freeze({
  phase: "background",
  interaction: "unavailable",
});

/** Unresolved, `unknown`, `extension`, or any value outside a platform's mapping. */
export const UNKNOWN_STATE: LifecycleState = Object.freeze({
  phase: "unknown",
  interaction: "unknown",
});
