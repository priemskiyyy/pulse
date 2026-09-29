import { getContext, onMount } from "svelte";
import { fromStore, writable } from "svelte/store";

import { PULSE_CONTEXT } from "src/svelte/PulseContext";
import type { LifecycleSource } from "src/types/LifecycleSource";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import type { Pulse } from "src/utils/Pulse";
import { PulseError } from "src/utils/PulseError";

/**
 * Reads a lifecycle source's snapshot through `current`, the given one or
 * the one from `setPulseContext`. It only observes: it never starts or
 * disposes the source, and reads unknown on the server and until mounted, so
 * the server and the hydrating client render the same markup.
 *
 * @example
 * ```ts
 * const lifecycle = useLifecycle();
 *
 * const isForeground = $derived(lifecycle.current.phase === "foreground");
 * ```
 */
export const useLifecycle = (source?: LifecycleSource) => {
  const resolved = source ?? getContext<Pulse | undefined>(PULSE_CONTEXT);

  if (resolved === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message:
        "useLifecycle needs a source, passed in or from setPulseContext.",
    });
  }

  const state = writable<LifecycleState>(UNKNOWN_LIFECYCLE_STATE);

  onMount(() => {
    state.set(resolved.state.get());

    return resolved.state.subscribe(() => state.set(resolved.state.get()));
  });

  return fromStore(state);
};
