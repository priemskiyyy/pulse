import type { LifecycleState } from "@priemskiyyy/pulse";

import type { SimulatedStateId } from "example-shared/lab/types/SimulatedStateId";
import type { Option } from "example-shared/types/Option";

export const SIMULATED_STATES: Record<SimulatedStateId, LifecycleState> = {
  foreground: { phase: "foreground", interaction: "available" },
  inactive: { phase: "foreground", interaction: "unavailable" },
  background: { phase: "background", interaction: "unavailable" },
  unknown: { phase: "unknown", interaction: "unknown" },
};

export const SIMULATED_STATE_OPTIONS: Option<SimulatedStateId>[] = [
  { value: "foreground", label: "Foreground" },
  { value: "inactive", label: "Inactive" },
  { value: "background", label: "Background" },
  { value: "unknown", label: "Unknown" },
];
