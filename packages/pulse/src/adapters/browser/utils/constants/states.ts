import type { LifecycleState } from "src/types/LifecycleState";

/** What a hidden, positively prerendering or pagehide-latched document reports. */
export const BACKGROUND_STATE: LifecycleState = Object.freeze({
  phase: "background",
  interaction: "unavailable",
});
