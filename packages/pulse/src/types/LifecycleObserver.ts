import type { LifecycleState } from "src/types/LifecycleState";

/**
 * What an adapter reports into: complete snapshots through `next`, and failures
 * through `error`, which only reports. An adapter that loses evidence first
 * sends a snapshot with the affected fields `unknown`.
 *
 * @example
 * ```ts
 * observer.next({ phase: "foreground", interaction: "unknown" });
 * observer.error(new Error("The focus getter threw."));
 * ```
 */
export type LifecycleObserver = {
  /** Reports a complete snapshot; a duplicate is legal and commits nothing. */
  next: (state: LifecycleState) => void;
  /** Reports a failure without changing the state. */
  error: (error: unknown) => void;
};
