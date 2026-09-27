import { expect, test } from "vitest";

import * as api from "src/index";

test("the root entry exports exactly its public runtime names", () => {
  expect(Object.keys(api).sort()).toEqual([
    "Pulse",
    "PulseError",
    "UNKNOWN_LIFECYCLE_STATE",
  ]);
});
