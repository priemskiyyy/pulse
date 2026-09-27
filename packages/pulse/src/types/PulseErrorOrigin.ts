/**
 * Where a reported error came from: the adapter's own report, an invalid
 * snapshot, the clock, a state or transition listener, the diagnostic callback,
 * or the adapter's cleanup.
 *
 * @example
 * ```ts
 * const origin: PulseErrorOrigin = "transition-listener";
 * ```
 */
export type PulseErrorOrigin =
  | "adapter"
  | "observation"
  | "clock"
  | "state-listener"
  | "transition-listener"
  | "diagnostic"
  | "cleanup";
