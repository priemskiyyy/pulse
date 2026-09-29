import { PulseError, UNKNOWN_LIFECYCLE_STATE } from "@priemskiyyy/pulse";
import type { LifecycleSource, LifecycleState } from "@priemskiyyy/pulse";
import { useContext, useSyncExternalStore } from "react";

import { PulseContext } from "src/context/PulseContext";

// One interned snapshot, so the server render and hydration read the same data.
const getServerSnapshot = () => UNKNOWN_LIFECYCLE_STATE;

/**
 * Reads a lifecycle source's current snapshot, the given one or the nearest
 * `PulseProvider`'s, and re-renders when it changes. It only observes: it
 * never starts or disposes the source, reads unknown on the server and during
 * hydration, and replays no transition.
 *
 * @example
 * ```tsx
 * const LifecycleLabel = () => {
 *   const { phase, interaction } = useLifecycle();
 *
 *   return <span>{phase} / {interaction}</span>;
 * };
 * ```
 */
export const useLifecycle = (source?: LifecycleSource): LifecycleState => {
  const provided = useContext(PulseContext);
  const resolved = source ?? provided;

  if (resolved === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message:
        "useLifecycle needs a source, passed in or from a PulseProvider.",
    });
  }

  return useSyncExternalStore(
    resolved.state.subscribe,
    resolved.state.get,
    getServerSnapshot,
  );
};
