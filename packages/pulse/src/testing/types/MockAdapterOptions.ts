import type { LifecycleState } from "src/types/LifecycleState";

/**
 * How a mock adapter starts: its source snapshot, `unknown` on both axes by
 * default, and whether each observation waits for `resolveInitial()` before
 * reporting it.
 *
 * @example
 * ```ts
 * const options: MockAdapterOptions = {
 *   initial: { phase: "foreground", interaction: "available" },
 *   deferInitial: true,
 * };
 * ```
 */
export type MockAdapterOptions = {
  /** The source snapshot each observation reports as its baseline. */
  initial?: LifecycleState;
  /** Each observation reports its baseline only at `resolveInitial()`. */
  deferInitial?: boolean;
};
