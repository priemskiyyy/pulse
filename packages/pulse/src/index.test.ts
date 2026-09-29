import { expect, test } from "vitest";

import * as browser from "src/browser";
import * as api from "src/index";
import * as react from "src/react";
import * as reactNative from "src/react-native";
import * as solid from "src/solid";
import * as svelte from "src/svelte";
import * as testing from "src/testing";
import * as vue from "src/vue";

test("every entry exports exactly its public runtime names", () => {
  expect(Object.keys(api).sort()).toEqual([
    "Pulse",
    "PulseError",
    "UNKNOWN_LIFECYCLE_STATE",
  ]);
  expect(Object.keys(browser).sort()).toEqual(["browser"]);
  expect(Object.keys(reactNative).sort()).toEqual(["reactNative"]);
  expect(Object.keys(react).sort()).toEqual([
    "PulseProvider",
    "useLifecycle",
    "usePulse",
  ]);
  expect(Object.keys(solid).sort()).toEqual([
    "PulseProvider",
    "useLifecycle",
    "usePulse",
  ]);
  expect(Object.keys(svelte).sort()).toEqual([
    "setPulseContext",
    "useLifecycle",
    "usePulse",
  ]);
  expect(Object.keys(vue).sort()).toEqual([
    "PulseProvider",
    "useLifecycle",
    "usePulse",
  ]);
  expect(Object.keys(testing).sort()).toEqual([
    "createMockAdapter",
    "createTestClock",
    "testLifecycleAdapter",
  ]);
});
