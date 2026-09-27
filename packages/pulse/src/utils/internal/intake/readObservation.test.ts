import { expect, test } from "vitest";

import type { LifecycleState } from "src/types/LifecycleState";
import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";
import { readObservation } from "src/utils/internal/intake/readObservation";

test("a valid snapshot is copied into its interned state", () => {
  const source: LifecycleState = {
    phase: "foreground",
    interaction: "available",
  };

  const read = readObservation(source);

  expect(read).toEqual({
    state: LIFECYCLE_STATES.foreground.available,
    error: null,
  });
  expect(read.state).not.toBe(source);

  source.phase = "background";

  expect(read.state).toEqual({ phase: "foreground", interaction: "available" });
});

test("C-043 background with any interaction other than unavailable is rejected", () => {
  const interactions: Array<"available" | "unknown"> = ["available", "unknown"];

  for (const interaction of interactions) {
    const read = readObservation({ phase: "background", interaction });

    expect(read.state).toBe(UNKNOWN_LIFECYCLE_STATE);
    expect(read.error).toMatchObject({ code: "INVALID_OBSERVATION" });
  }
});

test("each field is read exactly once", () => {
  let reads = 0;

  readObservation({
    get phase(): "unknown" {
      reads += 1;

      return "unknown";
    },
    interaction: "unknown",
  });

  expect(reads).toBe(1);
});

test("C-045 extra properties are ignored and never copied", () => {
  const source = {
    phase: "unknown",
    interaction: "available",
    url: "https://example.com/private",
  } satisfies LifecycleState & { url: string };

  const read = readObservation(source);

  expect(read.state).toBe(LIFECYCLE_STATES.unknown.available);
  expect(Object.keys(read.state)).toEqual(["phase", "interaction"]);
});
