import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";

/**
 * The two transitions `on()` accepts, by name. Interaction changes alone are
 * never a transition.
 *
 * @example
 * ```ts
 * const handleTransition = (event: LifecycleEvents["foreground"]) =>
 *   console.log(event.sequence);
 * ```
 */
export type LifecycleEvents = {
  foreground: ForegroundEvent;
  background: BackgroundEvent;
};
