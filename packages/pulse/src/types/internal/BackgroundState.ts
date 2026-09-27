import type { LifecycleState } from "src/types/LifecycleState";

export type BackgroundState = LifecycleState & {
  phase: "background";
  interaction: "unavailable";
};
