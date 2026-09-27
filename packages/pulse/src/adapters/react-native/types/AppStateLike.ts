import type { AppStateStatus } from "src/adapters/react-native/types/AppStateStatus";

/**
 * The part of React Native's `AppState` the adapter calls. `AppState` from
 * `react-native` satisfies it, so Pulse does not import React Native: the
 * application passes it in.
 *
 * @example
 * ```ts
 * import { AppState } from "react-native";
 *
 * const appState: AppStateLike = AppState;
 * ```
 */
export type AppStateLike = {
  /** The latest status React Native knows; older versions answer `null` until it resolves. */
  currentState: AppStateStatus | null;
  /** `false` when the runtime has no AppState module at all. */
  isAvailable: boolean;
  addEventListener: (
    type: "change" | "focus" | "blur",
    listener: (status: AppStateStatus) => void,
  ) => { remove: () => void };
};
