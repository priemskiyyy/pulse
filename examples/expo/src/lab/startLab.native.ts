import { reactNative } from "@priemskiyyy/pulse/react-native";
import { AppState, Platform } from "react-native";

import { REQUEST_LATENCY, STALE_AFTER } from "example-shared/lab/constants/lab";
import { createLifecycleLab } from "example-shared/lab/createLifecycleLab";
import { wait } from "example-shared/utils/wait";

const { major, minor, patch } = Platform.constants.reactNativeVersion;

/** The native build observes AppState; the platform file, not a runtime check, picks the adapter. */
export const startLab = () => {
  const lab = createLifecycleLab({
    adapter: reactNative({ appState: AppState, platform: Platform.OS }),
    staleAfter: STALE_AFTER,
    recording: true,
    request: () => wait(REQUEST_LATENCY),
  });

  // AppState as React Native reports it, recorded before Pulse starts; focus and blur arrive on Android only.
  AppState.addEventListener("change", (status) =>
    lab.recordHost({ name: "change", detail: status }),
  );
  AppState.addEventListener("focus", () =>
    lab.recordHost({ name: "focus", detail: "" }),
  );
  AppState.addEventListener("blur", () =>
    lab.recordHost({ name: "blur", detail: "" }),
  );
  lab.recordHost({
    name: "currentState",
    detail: String(AppState.currentState),
  });
  lab.start();

  return {
    lab,
    runtime: `${Platform.OS} ${Platform.Version}, React Native ${major}.${minor}.${patch}`,
  };
};
