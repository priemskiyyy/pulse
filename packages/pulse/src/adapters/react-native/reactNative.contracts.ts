// Typechecked, never imported: these assignments fail compilation if React
// Native's AppState stops satisfying the structural type the adapter uses.
import { AppState, Platform } from "react-native";

import { reactNative } from "src/adapters/react-native/reactNative";
import type { AppStateLike } from "src/adapters/react-native/types/AppStateLike";

export const appState: AppStateLike = AppState;

export const adapter = reactNative({
  appState: AppState,
  platform: Platform.OS,
});

// @ts-expect-error The AppState module is required; Pulse never imports it.
export const withoutAppState = reactNative({ platform: Platform.OS });

export const notAppState = reactNative({
  // @ts-expect-error An object without addEventListener is not an AppState.
  appState: { currentState: "active" },
  platform: "ios",
});
