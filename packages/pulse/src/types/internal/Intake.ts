import type { LifecycleState } from "src/types/LifecycleState";
import type { PulseErrorOrigin } from "src/types/PulseErrorOrigin";

export type Report = { error: unknown; origin: PulseErrorOrigin };

export type Intake =
  | {
      kind: "observation";
      state: LifecycleState;
      timestamp: number | null;
      reports: Report[];
    }
  | { kind: "error"; error: unknown };
