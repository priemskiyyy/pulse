import { expect, test } from "vitest";

import * as api from "src/index";
import * as testing from "src/testing";

test("every entry exports exactly its public runtime names", () => {
  expect(Object.keys(api).sort()).toEqual([
    "Pulse",
    "PulseError",
    "UNKNOWN_LIFECYCLE_STATE",
  ]);
  expect(Object.keys(testing).sort()).toEqual([
    "createMockAdapter",
    "createTestClock",
    "testLifecycleAdapter",
  ]);
});
