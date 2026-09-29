import {
  computed,
  inject,
  onMounted,
  onWatcherCleanup,
  shallowRef,
  watch,
} from "vue";
import type { ComputedRef, ShallowRef, WatchSource } from "vue";

import { PULSE_CONTEXT } from "src/vue/PulseContext";
import type { LifecycleSource } from "src/types/LifecycleSource";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { PulseError } from "src/utils/PulseError";

/**
 * Reads a lifecycle source's snapshot as a computed ref, the given one or the
 * nearest `PulseProvider`'s. It only observes: it never starts or disposes
 * the source, and reads unknown on the server and until mounted, so the
 * server and the hydrating client render the same markup.
 *
 * @example
 * ```ts
 * const state = useLifecycle();
 *
 * const isForeground = computed(() => state.value.phase === "foreground");
 * ```
 */
export const useLifecycle = (
  source?: LifecycleSource,
): ComputedRef<LifecycleState> => {
  const provided = inject(PULSE_CONTEXT, undefined);

  const resolve: WatchSource<LifecycleSource> | undefined =
    source === undefined ? provided : () => source;

  if (resolve === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message:
        "useLifecycle needs a source, passed in or from a PulseProvider.",
    });
  }

  const state: ShallowRef<LifecycleState> = shallowRef(UNKNOWN_LIFECYCLE_STATE);

  // A provider's Pulse can change, so the subscription follows it.
  onMounted(() => {
    watch(
      resolve,
      (current) => {
        state.value = current.state.get();
        onWatcherCleanup(
          current.state.subscribe(() => {
            state.value = current.state.get();
          }),
        );
      },
      { immediate: true, flush: "sync" },
    );
  });

  // Read-only, and the snapshot keeps its identity instead of being proxied.
  return computed(() => state.value);
};
