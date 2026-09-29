import { expect, test } from "vitest";

import * as api from "src/index";

test("the entry exports the provider and the composables, and nothing else", () => {
  expect(Object.keys(api).sort()).toEqual([
    "PulseProvider",
    "useLifecycle",
    "usePulse",
  ]);
});
