/**
 * What went wrong: an adapter whose setup failed, an instance used after it failed or was disposed, an adapter
 * snapshot outside the contract, or a clock that failed or moved backwards.
 *
 * @example
 * ```ts
 * const code: PulseErrorCode = "INVALID_OBSERVATION";
 * ```
 */
export type PulseErrorCode =
  | "START_FAILED"
  | "FAILED_INSTANCE"
  | "DISPOSED"
  | "INVALID_OBSERVATION"
  | "INVALID_CLOCK";
