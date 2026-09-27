import type { InteractionState } from "src/types/InteractionState";
import type { LifecyclePhase } from "src/types/LifecyclePhase";
import type { LifecycleState } from "src/types/LifecycleState";

/**
 * No usable evidence on either axis: every Pulse's first snapshot, and the one
 * a server render and hydration read. Frozen and safe to share.
 *
 * @example
 * ```ts
 * const getServerSnapshot = () => UNKNOWN_LIFECYCLE_STATE;
 * ```
 */
export const UNKNOWN_LIFECYCLE_STATE: LifecycleState = Object.freeze({
  phase: "unknown",
  interaction: "unknown",
});

/** Every valid snapshot, interned so an unchanged state keeps its identity; `null` marks a combination the contract forbids. */
export const LIFECYCLE_STATES: Record<
  LifecyclePhase,
  Record<InteractionState, LifecycleState | null>
> = Object.freeze({
  foreground: Object.freeze({
    available: Object.freeze({ phase: "foreground", interaction: "available" }),
    unavailable: Object.freeze({
      phase: "foreground",
      interaction: "unavailable",
    }),
    unknown: Object.freeze({ phase: "foreground", interaction: "unknown" }),
  }),
  background: Object.freeze({
    available: null,
    unavailable: Object.freeze({
      phase: "background",
      interaction: "unavailable",
    }),
    unknown: null,
  }),
  unknown: Object.freeze({
    available: Object.freeze({ phase: "unknown", interaction: "available" }),
    unavailable: Object.freeze({
      phase: "unknown",
      interaction: "unavailable",
    }),
    unknown: UNKNOWN_LIFECYCLE_STATE,
  }),
});
