import type { ForegroundState } from "src/types/internal/ForegroundState";
import type { LifecycleState } from "src/types/LifecycleState";

export const isForegroundState = (
  state: LifecycleState,
): state is ForegroundState => state.phase === "foreground";
