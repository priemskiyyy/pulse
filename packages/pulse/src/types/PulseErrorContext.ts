import type { PulseErrorOrigin } from "src/types/PulseErrorOrigin";

/**
 * The frozen context `onError` receives with each error: where it came from,
 * the adapter, and the commit sequence at the time.
 *
 * @example
 * ```ts
 * const onError = (error: unknown, context: PulseErrorContext) =>
 *   console.warn(context.origin, context.adapter.name, error);
 * ```
 */
export type PulseErrorContext = {
  origin: PulseErrorOrigin;
  adapter: { name: string };
  sequence: number;
};
