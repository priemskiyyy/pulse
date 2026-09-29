import type { Pulse } from "@priemskiyyy/pulse";
import type { Snippet } from "svelte";

/**
 * The props of `PulseProvider`: the Pulse it publishes and the content that
 * reads it.
 *
 * @example
 * ```ts
 * const props: PulseProviderProps = { pulse };
 * ```
 */
export type PulseProviderProps = {
  pulse: Pulse;
  children?: Snippet | undefined;
};
