import { PulseError } from "@priemskiyyy/pulse";
import type { Pulse } from "@priemskiyyy/pulse";
import { getContext } from "svelte";
import { PULSE_CONTEXT } from "../context/PulseContext.js";
import type { ReadableValue } from "../types/ReadableValue.js";

/**
 * Follows the nearest provider's Pulse through `current` and throws
 * `INVALID_CONFIGURATION` when there is none. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const pulse = usePulse();
 *
 * $effect(() => pulse.current.on("foreground", refresh));
 * ```
 */
export const usePulse = (): ReadableValue<Pulse> => {
  const pulse = getContext<ReadableValue<Pulse> | undefined>(PULSE_CONTEXT);

  if (pulse === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message: "usePulse must be used within a PulseProvider.",
    });
  }

  return pulse;
};
