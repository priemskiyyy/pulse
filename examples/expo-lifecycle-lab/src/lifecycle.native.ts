import { Pulse } from "@priemskiyyy/pulse";
import { reactNative } from "@priemskiyyy/pulse/react-native";
import { AppState, Platform } from "react-native";

import { recordCommit, trace } from "src/trace";

export const pulse = new Pulse({
  adapter: reactNative({ appState: AppState, platform: Platform.OS }),
  onDiagnostic: recordCommit,
});

const { major, minor, patch } = Platform.constants.reactNativeVersion;

export const runtime = `${Platform.OS} ${Platform.Version}, React Native ${major}.${minor}.${patch}`;

// AppState as React Native reports it; focus and blur arrive on Android only.
export const recordRawSignals = () => {
  const subscriptions = [
    AppState.addEventListener("change", (status) =>
      trace.push("raw", `change ${status}`),
    ),
    AppState.addEventListener("focus", () => trace.push("raw", "focus")),
    AppState.addEventListener("blur", () => trace.push("raw", "blur")),
  ];

  trace.push("raw", `currentState ${AppState.currentState}`);

  return () => {
    for (const subscription of subscriptions) {
      subscription.remove();
    }
  };
};
