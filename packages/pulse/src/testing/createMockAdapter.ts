import type { MockAdapterOptions } from "src/testing/types/MockAdapterOptions";
import type { MockLifecycleAdapter } from "src/testing/types/MockLifecycleAdapter";
import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";

type Observation = {
  observer: LifecycleObserver;
  baseline: LifecycleState | null;
};

/**
 * A well-behaved adapter over a scriptable source, for tests. Each `observe`
 * has its own cleanup and baseline, duplicates are forwarded for the core to
 * drop, and nothing waits on a timer.
 *
 * @example
 * ```ts
 * const mock = createMockAdapter({
 *   initial: { phase: "foreground", interaction: "available" },
 * });
 * const pulse = new Pulse({ adapter: mock.adapter });
 *
 * pulse.start();
 * mock.emit({ phase: "background", interaction: "unavailable" });
 * pulse.dispose();
 * mock.stats().activeObservations; // 0
 * ```
 */
export const createMockAdapter = ({
  initial = UNKNOWN_LIFECYCLE_STATE,
  deferInitial = false,
}: MockAdapterOptions = {}): MockLifecycleAdapter => {
  let current = initial;
  let started = 0;
  let closed = 0;
  let latest: LifecycleObserver | null = null;
  const open = new Set<Observation>();

  const getLatest = () => {
    if (latest === null) {
      throw new Error("The mock adapter has not been observed yet.");
    }

    return latest;
  };

  return Object.freeze({
    adapter: Object.freeze({
      name: "mock",
      available: () => true,
      observe: (observer: LifecycleObserver) => {
        const observation: Observation = {
          observer,
          baseline: deferInitial ? current : null,
        };

        started += 1;
        latest = observer;
        open.add(observation);

        if (!deferInitial) {
          observer.next(current);
        }

        return () => {
          if (!open.delete(observation)) {
            return;
          }

          closed += 1;
        };
      },
    }),
    emit: (state: LifecycleState) => {
      current = state;

      const observations = [...open];

      // Every pending baseline is stale now, even for a reentrant resolveInitial().
      for (const observation of observations) {
        observation.baseline = null;
      }

      for (const observation of observations) {
        if (open.has(observation)) {
          observation.observer.next(state);
        }
      }
    },
    error: (error: unknown) => {
      for (const observation of [...open]) {
        if (open.has(observation)) {
          observation.observer.error(error);
        }
      }
    },
    resolveInitial: () => {
      for (const observation of [...open]) {
        const { baseline } = observation;

        observation.baseline = null;

        if (baseline !== null && open.has(observation)) {
          observation.observer.next(baseline);
        }
      }
    },
    stats: () =>
      Object.freeze({
        observationsStarted: started,
        observationsClosed: closed,
        activeObservations: open.size,
      }),
    unsafe: Object.freeze({
      emitAfterCleanup: (state: LifecycleState) => getLatest().next(state),
      errorAfterCleanup: (error: unknown) => getLatest().error(error),
    }),
  });
};
