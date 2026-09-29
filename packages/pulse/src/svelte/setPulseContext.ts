import { setContext } from "svelte";

import { PULSE_CONTEXT } from "src/svelte/PulseContext";
import type { Pulse } from "src/utils/Pulse";

/**
 * Publishes one Pulse to the component and its children; Svelte's provider,
 * called while the root component initializes. It only publishes: it never
 * starts or disposes the Pulse, so start it at bootstrap.
 *
 * @example
 * ```svelte
 * <script>
 *   setPulseContext(pulse);
 * </script>
 * ```
 */
export const setPulseContext = (pulse: Pulse) => {
  setContext(PULSE_CONTEXT, pulse);
};
