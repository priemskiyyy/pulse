import type { LifecycleSource } from "@priemskiyyy/pulse";
import type { FocusManager } from "@tanstack/query-core";

/**
 * Drives TanStack Query's focus from Pulse's phase: foreground is focused,
 * background and unknown are not. Browser focus-only changes, iOS `inactive`
 * and the Android notification drawer leave it focused. Install it once, at
 * the application's bootstrap; a later install replaces it, and nothing
 * restores whatever listener was there before.
 *
 * @example
 * ```ts
 * import { focusManager } from "@tanstack/query-core";
 *
 * installPulseQueryFocus(pulse, focusManager);
 * pulse.start();
 * ```
 */
export const installPulseQueryFocus = (
  source: LifecycleSource,
  manager: Pick<FocusManager, "setEventListener">,
) => {
  manager.setEventListener((setFocused) => {
    let closed = false;
    let previous: boolean | null = null;

    const handleChange = () => {
      if (closed) {
        return;
      }

      const focused = source.state.get().phase === "foreground";

      if (focused === previous) {
        return;
      }

      previous = focused;
      setFocused(focused);
    };

    const unsubscribe = source.state.subscribe(handleChange);

    try {
      handleChange();
    } catch (error) {
      closed = true;
      unsubscribe();
      throw error;
    }

    return () => {
      if (closed) {
        return;
      }

      closed = true;
      unsubscribe();
    };
  });
};
