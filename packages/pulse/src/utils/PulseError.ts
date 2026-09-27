import type { PulseErrorCode } from "src/types/PulseErrorCode";

/**
 * An error Pulse created, with a `code` to branch on. What an adapter,
 * listener or clock throws reaches `onError` as it was thrown, or as the
 * `cause` of one of these.
 *
 * @example
 * ```ts
 * try {
 *   pulse.start();
 * } catch (error) {
 *   if (error instanceof PulseError && error.code === "START_FAILED") {
 *     console.warn(error.cause);
 *   }
 * }
 * ```
 */
export class PulseError extends Error {
  code: PulseErrorCode;

  constructor({
    code,
    message,
    cause,
  }: {
    code: PulseErrorCode;
    message: string;
    cause?: unknown;
  }) {
    super(message);
    this.name = "PulseError";
    this.code = code;

    // Set directly, since engines without the Error cause option ignore it; an absent cause stays absent.
    if (cause === undefined) {
      return;
    }

    this.cause = cause;
  }
}
