import { PulseError } from "@priemskiyyy/pulse";
import type { Pulse } from "@priemskiyyy/pulse";
import { useContext } from "react";

import { PulseContext } from "src/context/PulseContext";

/**
 * Returns the nearest provider's Pulse and throws `INVALID_CONFIGURATION`
 * when there is none. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const pulse = usePulse();
 *
 * useEffect(() => pulse.on("foreground", refresh), [pulse]);
 * ```
 */
export const usePulse = (): Pulse => {
  const pulse = useContext(PulseContext);

  if (pulse === undefined) {
    throw new PulseError({
      code: "INVALID_CONFIGURATION",
      message: "usePulse must be used within a PulseProvider.",
    });
  }

  return pulse;
};
