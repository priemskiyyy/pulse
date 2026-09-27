/**
 * A readable value with change notifications. `subscribe` never calls back at
 * once, and answers its unsubscriber.
 *
 * @example
 * ```ts
 * const stop = pulse.state.subscribe(() => console.log(pulse.state.get().phase));
 * ```
 */
export type ObservableValue<TValue> = {
  get: () => TValue;
  subscribe: (listener: () => void) => () => void;
};
