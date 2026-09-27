import type { BackgroundState } from "src/types/internal/BackgroundState";
import type { ForegroundState } from "src/types/internal/ForegroundState";

/**
 * An observed, adjacent phase change from `background` to `foreground`. It can
 * be the first entry after a background baseline, so it is not a "return", and
 * it never crosses an `unknown` phase.
 *
 * @example
 * ```ts
 * pulse.on("foreground", (event) => console.log(event.observedAway));
 * ```
 */
export type ForegroundEvent = {
  type: "foreground";
  /** The commit sequence of `to`; transition sequences need not be consecutive. */
  sequence: number;
  from: BackgroundState;
  to: ForegroundState;
  /** Epoch milliseconds the clock gave when the observation arrived, or `null` when it failed. */
  observedAt: number | null;
  /** Milliseconds since the observed departure, an estimate and never a stopwatch; `null` without a fully observed pair. */
  observedAway: number | null;
};
