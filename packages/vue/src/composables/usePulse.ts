import { PulseError } from "@priemskiyyy/pulse";
import type { Pulse } from "@priemskiyyy/pulse";
import { inject } from "vue";
import type { ComputedRef } from "vue";

import { PULSE_CONTEXT } from "src/context/PulseContext";

/**
 * Returns the nearest provider's Pulse as a computed ref and throws
 * `INVALID_CONFIGURATION` when there is none. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const pulse = usePulse();
 *
 * onScopeDispose(pulse.value.on("foreground", refresh));
 * ```
 */
export const usePulse = (): ComputedRef<Pulse> => {
  const pulse = inject(PULSE_CONTEXT, undefined);

  if (pulse === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message: "usePulse must be used within a PulseProvider.",
    });
  }

  return pulse;
};
