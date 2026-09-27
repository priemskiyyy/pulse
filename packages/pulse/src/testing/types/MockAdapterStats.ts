/**
 * A frozen count of a mock adapter's observations, for assertions. It is a
 * snapshot, not a store.
 *
 * @example
 * ```ts
 * const { activeObservations }: MockAdapterStats = mock.stats();
 * ```
 */
export type MockAdapterStats = {
  observationsStarted: number;
  observationsClosed: number;
  activeObservations: number;
};
