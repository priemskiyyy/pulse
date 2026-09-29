import type { Pulse } from "@priemskiyyy/pulse";
import type { PropsWithChildren } from "react";

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
