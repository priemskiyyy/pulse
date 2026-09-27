/**
 * The activation or input-focus evidence for the observed host: `available`,
 * `unavailable`, or `unknown` when the source cannot tell. It says nothing about
 * attention, presence or a user gesture.
 *
 * @example
 * ```ts
 * const focused = pulse.state.get().interaction === "available";
 * ```
 */
export type InteractionState = "available" | "unavailable" | "unknown";
