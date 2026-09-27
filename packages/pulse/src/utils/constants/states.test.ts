import { expect, test } from "vitest";

import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";

test("seven combinations are valid, and background is always unavailable", () => {
  const valid = Object.values(LIFECYCLE_STATES).flatMap((row) =>
    Object.values(row).flatMap((state) => (state === null ? [] : [state])),
  );

  expect(valid).toHaveLength(7);
  expect(LIFECYCLE_STATES.background).toEqual({
    available: null,
    unavailable: { phase: "background", interaction: "unavailable" },
    unknown: null,
  });
});

test("every interned snapshot is frozen and names its own cell", () => {
  for (const [phase, row] of Object.entries(LIFECYCLE_STATES)) {
    expect(Object.isFrozen(row)).toBe(true);

    for (const [interaction, state] of Object.entries(row)) {
      if (state === null) {
        continue;
      }

      expect(Object.isFrozen(state)).toBe(true);
      expect(state).toEqual({ phase, interaction });
    }
  }

  expect(LIFECYCLE_STATES.unknown.unknown).toBe(UNKNOWN_LIFECYCLE_STATE);
});
