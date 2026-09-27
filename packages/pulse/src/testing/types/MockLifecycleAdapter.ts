import type { MockAdapterStats } from "src/testing/types/MockAdapterStats";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import type { LifecycleState } from "src/types/LifecycleState";

/**
 * A scriptable lifecycle source and the adapter over it. `emit` and `error`
 * reach every open observation, duplicates included; `unsafe` reaches a
 * closed one on purpose, for hostile tests.
 *
 * @example
 * ```ts
 * const mock: MockLifecycleAdapter = createMockAdapter();
 *
 * mock.emit({ phase: "background", interaction: "unavailable" });
 * ```
 */
export type MockLifecycleAdapter = {
  adapter: LifecycleAdapter;
  /** Sets the source snapshot and reports it to every open observation. */
  emit: (state: LifecycleState) => void;
  /** Reports an error to every open observation, without changing the snapshot. */
  error: (error: unknown) => void;
  /** Reports each deferred baseline that no later `emit` has superseded. */
  resolveInitial: () => void;
  stats: () => MockAdapterStats;
  /** Deliberately calls the latest observation's callbacks after its cleanup. */
  unsafe: {
    emitAfterCleanup: (state: LifecycleState) => void;
    errorAfterCleanup: (error: unknown) => void;
  };
};
