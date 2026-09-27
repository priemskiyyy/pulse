import type { LifecycleState } from "src/types/LifecycleState";

export type ForegroundState = LifecycleState & { phase: "foreground" };
