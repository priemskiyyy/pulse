import { expect, test } from "vitest";

import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";
import { readObservation } from "src/utils/internal/intake/readObservation";

const expectInvalid = (value: unknown) => {
  const read = readObservation(value);

  expect(read.state).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(read.error).toMatchObject({ code: "INVALID_OBSERVATION" });

  return read.error;
};

test("a valid snapshot is copied into its interned state", () => {
  const source = { phase: "foreground", interaction: "available" };
  const read = readObservation(source);

  expect(read).toEqual({
    state: LIFECYCLE_STATES.foreground.available,
    error: null,
  });
  expect(read.state).not.toBe(source);

  source.phase = "background";

  expect(read.state).toEqual({ phase: "foreground", interaction: "available" });
});

test("C-041 a value without both fields is invalid, not a partial patch", () => {
  expectInvalid(null);
  expectInvalid("foreground");
  expectInvalid(() => {});
  expectInvalid({ phase: "foreground" });
  expectInvalid({ interaction: "available" });
});

test("C-042 an unknown enum string never falls through to a known value", () => {
  expectInvalid({ phase: "active", interaction: "available" });
  expectInvalid({ phase: "foreground", interaction: "focused" });
  expectInvalid({ phase: "Foreground", interaction: "available" });
});

test("C-043 background with any interaction other than unavailable is rejected", () => {
  expectInvalid({ phase: "background", interaction: "available" });
  expectInvalid({ phase: "background", interaction: "unknown" });
});

test("C-044 a throwing getter is contained and kept as the cause", () => {
  const failure = new Error("getter failed");

  const error = expectInvalid({
    phase: "foreground",
    get interaction() {
      throw failure;
    },
  });

  expect(error?.cause).toBe(failure);
});

test("each field is read exactly once", () => {
  let reads = 0;

  readObservation({
    get phase() {
      reads += 1;

      return "unknown";
    },
    interaction: "unknown",
  });

  expect(reads).toBe(1);
});

test("C-045 extra properties are ignored and never copied", () => {
  const read = readObservation({
    phase: "unknown",
    interaction: "available",
    url: "https://example.com/private",
  });

  expect(read.state).toBe(LIFECYCLE_STATES.unknown.available);
  expect(Object.keys(read.state)).toEqual(["phase", "interaction"]);
});

test("an invalid snapshot's error never describes the value", () => {
  const error = expectInvalid({
    phase: "secret-token-123",
    interaction: "available",
  });

  expect(error?.message).not.toContain("secret-token-123");
});
