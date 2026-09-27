import { Pulse } from "@priemskiyyy/pulse";
import type { LifecycleAdapter } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";

import { TIMELINE_LENGTH } from "example-shared/lab/constants/lab";
import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import type { RefreshState } from "example-shared/lab/types/RefreshState";
import type { RefreshStatus } from "example-shared/lab/types/RefreshStatus";
import type { TimelineEntry } from "example-shared/lab/types/TimelineEntry";
import { createEventLog } from "example-shared/utils/createEventLog";
import { createValueStore } from "example-shared/utils/createValueStore";

type DistributiveOmit<T, TKey extends PropertyKey> = T extends unknown
  ? Omit<T, TKey>
  : never;

type LifecycleLabOptions = {
  adapter: LifecycleAdapter;
  staleAfter: number;
  recording: boolean;
  /** The application's own request; a rejection is shown, never thrown. */
  request: () => Promise<void>;
  now?: () => number;
};

export const createLifecycleLab = ({
  adapter,
  staleAfter,
  recording: initialRecording,
  request,
  now = Date.now,
}: LifecycleLabOptions): LifecycleLab => {
  const { log, add } = createEventLog<TimelineEntry>(TIMELINE_LENGTH);

  const refresh = createValueStore<RefreshState>({
    refreshes: 0,
    status: { state: "idle" },
  });

  const failNextRefresh = createValueStore(false);
  const recording = createValueStore(initialRecording);
  const observing = createValueStore(false);
  let nextId = 1;
  let loadedAt = now();
  let inFlight = false;

  const record = (entry: DistributiveOmit<TimelineEntry, "id" | "at">) => {
    add({ ...entry, id: nextId, at: now() });
    nextId += 1;
  };

  const setStatus = (status: RefreshStatus, refreshes: number) => {
    refresh.set({ refreshes, status });
    record({ source: "refresh", status });
  };

  // One refresh at a time: a foreground transition during a refresh joins it.
  const refreshIfStale = () => {
    if (inFlight) {
      return;
    }

    if (now() - loadedAt < staleAfter) {
      return;
    }

    const shouldFail = failNextRefresh.get();

    inFlight = true;
    failNextRefresh.set(false);
    setStatus({ state: "refreshing" }, refresh.get().refreshes);
    request()
      .then(() => {
        if (shouldFail) {
          throw new Error("The simulated request failed.");
        }

        loadedAt = now();
        setStatus(
          { state: "refreshed", at: loadedAt },
          refresh.get().refreshes + 1,
        );
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);

        setStatus({ state: "failed", message }, refresh.get().refreshes);
      })
      .finally(() => {
        inFlight = false;
      });
  };

  const pulse = new Pulse({
    adapter,
    now,
    onDiagnostic: (diagnostic) => record({ source: "pulse", diagnostic }),
  });

  const mock = createMockAdapter();
  const simulation = new Pulse({ adapter: mock.adapter });

  pulse.on("foreground", (event) => {
    record({ source: "transition", event });
    // A foreground transition is not proof that a person came back; stale data is the only trigger.
    refreshIfStale();
  });
  pulse.on("background", (event) => record({ source: "transition", event }));

  return {
    pulse,
    simulation,
    simulate: mock.emit,
    refresh,
    failNextRefresh,
    recording,
    timeline: log,
    recordHost: (signal) => {
      if (!recording.get()) {
        return;
      }

      record({ source: "host", signal });
    },
    observing,
    start: () => {
      pulse.start();
      simulation.start();
      observing.set(true);
    },
    stopObserving: () => {
      pulse.dispose();
      observing.set(false);
    },
    dispose: () => {
      pulse.dispose();
      simulation.dispose();
      observing.set(false);
    },
  };
};
