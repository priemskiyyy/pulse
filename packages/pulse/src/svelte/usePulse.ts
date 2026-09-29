import { getContext, hasContext } from "svelte";

import { PULSE_CONTEXT } from "src/svelte/PulseContext";
import type { Pulse } from "src/utils/Pulse";
import { PulseError } from "src/utils/PulseError";

/**
 * Returns the Pulse published by `setPulseContext` and throws
 * `INVALID_CONFIGURATION` when there is none. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const pulse = usePulse();
 *
 * onMount(() => pulse.on("foreground", refresh));
 * ```
 */
export const usePulse = (): Pulse => {
  if (!hasContext(PULSE_CONTEXT)) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message: "usePulse must be used below setPulseContext.",
    });
  }

  return getContext<Pulse>(PULSE_CONTEXT);
};
