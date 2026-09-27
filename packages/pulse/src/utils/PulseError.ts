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
    // `{ cause: undefined }` would still give the error a `cause` of its own.
    super(message, cause === undefined ? undefined : { cause });
    this.name = "PulseError";
    this.code = code;
  }
}
