import "@expo/metro-runtime";
import { registerRootComponent } from "expo";

import { App } from "src/App";
import { pulse, recordRawSignals } from "src/lifecycle";

// The application owns one observation for its whole life. Raw recording starts first, so it sees the baseline too.
recordRawSignals();
pulse.start();
registerRootComponent(App);
