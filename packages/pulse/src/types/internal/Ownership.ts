import type { PulseHost } from "src/types/internal/PulseHost";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";

export type Ownership =
  | { state: "CREATED"; adapter: LifecycleAdapter; host: PulseHost }
  | { state: "STARTING"; token: object; host: PulseHost }
  | { state: "RUNNING"; token: object; host: PulseHost; cleanup: () => void }
  | { state: "FAILED" }
  | { state: "DISPOSED" };
