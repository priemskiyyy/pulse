import { PulseError, UNKNOWN_LIFECYCLE_STATE } from "@priemskiyyy/pulse";
import type {
  LifecycleSource,
  LifecycleState,
  Pulse,
} from "@priemskiyyy/pulse";
import { getContext } from "svelte";
import { PULSE_CONTEXT } from "../context/PulseContext.js";
import type { ReadableValue } from "../types/ReadableValue.js";

/**
 * Reads a lifecycle source's snapshot through `current`, the given one or the
 * nearest `PulseProvider`'s. It only observes: it never starts or disposes
 * the source, and reads unknown on the server and until mounted, so the
 * server and the hydrating client render the same markup.
 *
 * @example
 * ```ts
 * const lifecycle = useLifecycle();
 *
 * const isForeground = $derived(lifecycle.current.phase === "foreground");
 * ```
 */
export const useLifecycle = (
  source?: LifecycleSource,
): ReadableValue<LifecycleState> => {
  const provided = getContext<ReadableValue<Pulse> | undefined>(PULSE_CONTEXT);

  const resolve: ReadableValue<LifecycleSource> | undefined =
    source === undefined ? provided : { current: source };

  if (resolve === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message:
        "useLifecycle needs a source, passed in or from a PulseProvider.",
    });
  }

  // Derived, so a provider that publishes a new Pulse moves the subscription.
  const observed = $derived(resolve.current);
  // Raw, so the snapshot keeps its identity instead of being proxied.
  let snapshot: LifecycleState = $state.raw(UNKNOWN_LIFECYCLE_STATE);

  // Effects never run on the server and run after mount on the client, so both render unknown first.
  $effect(() => {
    const current = observed;

    snapshot = current.state.get();

    return current.state.subscribe(() => {
      snapshot = current.state.get();
    });
  });

  return {
    get current() {
      return snapshot;
    },
  };
};
