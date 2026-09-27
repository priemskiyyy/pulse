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
  /** The latest state React Native knows; `null` or `unknown` until it resolves. */
  currentState: string | null | undefined;
  /** `false` when the runtime has no AppState module at all. */
  isAvailable?: boolean;
  addEventListener: (
    type: "change" | "focus" | "blur",
    listener: (state: string) => void,
  ) => { remove: () => void };
};
