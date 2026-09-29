import type { PropsWithChildren } from "react";

import { PulseContext } from "src/react/PulseContext";
import type { Pulse } from "src/utils/Pulse";

/**
 * The Pulse to publish to the tree below.
 *
 * @example
 * ```tsx
 * const props: PulseProviderProps = { pulse };
 * ```
 */
export type PulseProviderProps = PropsWithChildren<{
  pulse: Pulse;
}>;

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
