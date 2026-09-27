import type { LifecycleState, Pulse } from "@priemskiyyy/pulse";

import type { HostSignal } from "example-shared/lab/types/HostSignal";
import type { RefreshState } from "example-shared/lab/types/RefreshState";
import type { TimelineEntry } from "example-shared/lab/types/TimelineEntry";
import type { EventLog } from "example-shared/types/EventLog";
import type { ValueStore } from "example-shared/types/ValueStore";

export type LifecycleLab = {
  /** The one Pulse the application owns for its whole life. */
  pulse: Pulse;
  /** A separate Pulse over a mock adapter; nothing in it comes from the host. */
  simulation: Pulse;
  simulate: (state: LifecycleState) => void;
  refresh: ValueStore<RefreshState>;
  failNextRefresh: ValueStore<boolean>;
  recording: ValueStore<boolean>;
  timeline: EventLog<TimelineEntry>;
  recordHost: (signal: HostSignal) => void;
  /** Whether the lab's own Pulse still observes; the lab decides, not Pulse. */
  observing: ValueStore<boolean>;
  start: () => void;
  /** Ends the real observation for good; the simulation keeps running. */
  stopObserving: () => void;
  dispose: () => void;
};
