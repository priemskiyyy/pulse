import type { InteractionState } from "src/types/InteractionState";
import type { LifecyclePhase } from "src/types/LifecyclePhase";

/**
 * One immutable lifecycle snapshot. `background` always carries `interaction:
 * "unavailable"`, so seven combinations are valid; published snapshots are
 * frozen and keep their identity while unchanged.
 *
 * @example
 * ```ts
 * const { phase, interaction } = pulse.state.get();
 * ```
 */
export type LifecycleState = {
  phase: LifecyclePhase;
  interaction: InteractionState;
};
