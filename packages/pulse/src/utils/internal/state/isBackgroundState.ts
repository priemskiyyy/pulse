import type { BackgroundState } from "src/types/internal/BackgroundState";
import type { LifecycleState } from "src/types/LifecycleState";

export const isBackgroundState = (
  state: LifecycleState,
): state is BackgroundState =>
  state.phase === "background" && state.interaction === "unavailable";
