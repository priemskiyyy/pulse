import type { LifecycleState } from "@priemskiyyy/pulse";

import type { Option } from "example-shared/types/Option";

export const SIMULATED_STATES: Option<LifecycleState>[] = [
  {
    value: { phase: "foreground", interaction: "available" },
    label: "Foreground",
  },
  {
    value: { phase: "foreground", interaction: "unavailable" },
    label: "Inactive",
  },
  {
    value: { phase: "background", interaction: "unavailable" },
    label: "Background",
  },
  { value: { phase: "unknown", interaction: "unknown" }, label: "Unknown" },
];
