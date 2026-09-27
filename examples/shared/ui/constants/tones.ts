import type { InteractionState, LifecyclePhase } from "@priemskiyyy/pulse";

import type { RefreshStatus } from "example-shared/lab/types/RefreshStatus";
import type { TimelineSource } from "example-shared/lab/types/TimelineSource";
import type { Tone } from "example-shared/ui/types/Tone";

export const PHASE_TONES: Record<LifecyclePhase, Tone> = {
  foreground: "positive",
  background: "neutral",
  unknown: "warning",
};

export const INTERACTION_TONES: Record<InteractionState, Tone> = {
  available: "positive",
  unavailable: "neutral",
  unknown: "warning",
};

export const REFRESH_TONES: Record<RefreshStatus["state"], Tone> = {
  idle: "neutral",
  refreshing: "info",
  refreshed: "positive",
  failed: "danger",
};

export const TIMELINE_SOURCE_TONES: Record<TimelineSource, Tone> = {
  pulse: "accent",
  transition: "positive",
  host: "neutral",
  refresh: "info",
};
