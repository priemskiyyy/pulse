import type {
  BackgroundEvent,
  ForegroundEvent,
  PulseDiagnostic,
} from "@priemskiyyy/pulse";

import type { HostSignal } from "example-shared/lab/types/HostSignal";
import type { RefreshStatus } from "example-shared/lab/types/RefreshStatus";

export type TimelineEntry = { id: number; at: number } & (
  | { source: "pulse"; diagnostic: PulseDiagnostic }
  | { source: "transition"; event: ForegroundEvent | BackgroundEvent }
  | { source: "host"; signal: HostSignal }
  | { source: "refresh"; status: RefreshStatus }
);
