/**
 * What went wrong: an adapter whose probe or setup threw, an instance used
 * after it failed or was disposed, an adapter snapshot outside the contract,
 * a clock that failed or moved backwards, or a React hook with no source.
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
  | "INVALID_CLOCK"
  | "INVALID_CONFIGURATION";
