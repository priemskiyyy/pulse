import { PulseError, UNKNOWN_LIFECYCLE_STATE } from "@priemskiyyy/pulse";
import type { LifecycleSource, LifecycleState } from "@priemskiyyy/pulse";
import {
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import type { Accessor } from "solid-js";

import { PulseContext } from "src/context/PulseContext";

/**
 * Reads a lifecycle source's snapshot as an accessor, the given one or the
 * nearest `PulseProvider`'s. It only observes: it never starts or disposes
 * the source, and reads unknown on the server and until mounted, so
 * hydration claims the server markup as it is.
 *
 * @example
 * ```tsx
 * const state = useLifecycle();
 *
 * <span>{state().phase} / {state().interaction}</span>;
 * ```
 */
export const useLifecycle = (
  source?: LifecycleSource,
): Accessor<LifecycleState> => {
  const provided = useContext(PulseContext);
  const resolve = source === undefined ? provided : () => source;

  if (resolve === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message:
        "useLifecycle needs a source, passed in or from a PulseProvider.",
    });
  }

  const [state, setState] = createSignal<LifecycleState>(
    UNKNOWN_LIFECYCLE_STATE,
  );

  // A provider's Pulse can change, so the subscription follows it.
  onMount(() => {
    createEffect(() => {
      const current = resolve();

      setState(current.state.get());
      onCleanup(current.state.subscribe(() => setState(current.state.get())));
    });
  });

  return state;
};
