import { PulseContext } from "src/context/PulseContext";
import type { PulseProviderProps } from "src/types/PulseProviderProps";

/**
 * Publishes one Pulse to the tree below. It only publishes: it never starts
 * or disposes the Pulse, so start it at bootstrap.
 *
 * @example
 * ```tsx
 * <PulseProvider pulse={pulse}>
 *   <Application />
 * </PulseProvider>
 * ```
 */
export const PulseProvider = ({ pulse, children }: PulseProviderProps) => (
  <PulseContext.Provider value={pulse}>{children}</PulseContext.Provider>
);
