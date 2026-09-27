import type { LifecycleState } from "src/types/LifecycleState";
import type { ObservableValue } from "src/types/ObservableValue";

/**
 * The structural shape a consumer needs to read lifecycle state: a `Pulse`
 * satisfies it, and so does any object with the same `state` readable.
 *
 * @example
 * ```ts
 * const isForeground = (source: LifecycleSource) =>
 *   source.state.get().phase === "foreground";
 * ```
 */
export type LifecycleSource = {
  state: ObservableValue<LifecycleState>;
};
