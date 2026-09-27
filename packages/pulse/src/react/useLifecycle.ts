import { useSyncExternalStore } from "react";

import type { LifecycleSource } from "src/types/LifecycleSource";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";

// One interned snapshot, so the server render and hydration read the same data.
const getServerSnapshot = () => UNKNOWN_LIFECYCLE_STATE;

/**
 * Reads a lifecycle source's current snapshot and re-renders when it changes.
 * It only observes: it never starts or disposes the source, reads unknown on
 * the server and during hydration, and replays no transition.
 *
 * @example
 * ```tsx
 * const LifecycleLabel = () => {
 *   const { phase, interaction } = useLifecycle(pulse);
 *
 *   return <span>{phase} / {interaction}</span>;
 * };
 * ```
 */
export const useLifecycle = (source: LifecycleSource): LifecycleState =>
  useSyncExternalStore(
    source.state.subscribe,
    source.state.get,
    getServerSnapshot,
  );
