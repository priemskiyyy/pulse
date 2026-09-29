import { PulseError } from "@priemskiyyy/pulse";
import type { Pulse } from "@priemskiyyy/pulse";
import { useContext } from "solid-js";
import type { Accessor } from "solid-js";

import { PulseContext } from "src/context/PulseContext";

/**
 * Follows the nearest provider's Pulse as an accessor and throws
 * `INVALID_CONFIGURATION` when there is none. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const pulse = usePulse();
 *
 * onCleanup(pulse().on("foreground", refresh));
 * ```
 */
export const usePulse = (): Accessor<Pulse> => {
  const pulse = useContext(PulseContext);

  if (pulse === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message: "usePulse must be used within a PulseProvider.",
    });
  }

  return pulse;
};
