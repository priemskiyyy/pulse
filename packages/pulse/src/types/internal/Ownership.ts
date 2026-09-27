import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { PulseHost } from "src/types/internal/PulseHost";

export type Ownership =
  | {
      state: "CREATED";
      observe: (observer: LifecycleObserver) => unknown;
      host: PulseHost;
    }
  | { state: "STARTING"; token: object; host: PulseHost }
  | { state: "RUNNING"; token: object; host: PulseHost; cleanup: () => void }
  | { state: "FAILED" }
  | { state: "DISPOSED" };
