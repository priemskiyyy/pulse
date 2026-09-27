import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import type { PulseDiagnostic } from "src/types/PulseDiagnostic";
import type { PulseErrorContext } from "src/types/PulseErrorContext";

/**
 * What a `Pulse` observes, and where it reports. Every field is read once, at
 * construction; the types are the validation.
 *
 * @example
 * ```ts
 * const options: PulseOptions = {
 *   adapter: browser(),
 *   onError: (error, context) => console.warn(context.origin, error),
 * };
 * ```
 */
export type PulseOptions = {
  adapter: LifecycleAdapter;
  /** Epoch milliseconds, `Date.now` by default; sampled once per observation. */
  now?: () => number;
  /** Receives every reported error; a guarded `console.error` otherwise. */
  onError?: (error: unknown, context: PulseErrorContext) => void;
  /** Receives each diagnostic synchronously; none is built without it. */
  onDiagnostic?: (diagnostic: PulseDiagnostic) => void;
};
