import type { BackgroundState } from "src/types/internal/BackgroundState";
import type { ForegroundState } from "src/types/internal/ForegroundState";

/**
 * An observed, adjacent phase change from `foreground` to `background`. It is
 * not permission to keep running, and work it starts may never finish.
 *
 * @example
 * ```ts
 * pulse.on("background", (event) => console.log(event.observedAt));
 * ```
 */
export type BackgroundEvent = {
  type: "background";
  /** The commit sequence of `to`; transition sequences need not be consecutive. */
  sequence: number;
  from: ForegroundState;
  to: BackgroundState;
  /** Epoch milliseconds the clock gave when the observation arrived, or `null` when it failed. */
  observedAt: number | null;
};
