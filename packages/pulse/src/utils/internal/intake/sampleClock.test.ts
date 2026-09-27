import { expect, test } from "vitest";

import { sampleClock } from "src/utils/internal/intake/sampleClock";

test("a finite sample is kept as it was answered, including zero and negatives", () => {
  expect(sampleClock(() => 1_000)).toEqual({ timestamp: 1_000, error: null });
  expect(sampleClock(() => 0)).toEqual({ timestamp: 0, error: null });
  expect(sampleClock(() => -5)).toEqual({ timestamp: -5, error: null });
});

test("C-052 a throwing clock answers no timestamp and keeps the thrown value", () => {
  const failure = new Error("clock failed");

  const sample = sampleClock(() => {
    throw failure;
  });

  expect(sample.timestamp).toBeNull();
  expect(sample.error).toMatchObject({ code: "INVALID_CLOCK" });
  expect(sample.error?.cause).toBe(failure);
});

test("C-053 a NaN, infinite or non-number sample is never published", () => {
  const answers: unknown[] = [NaN, Infinity, -Infinity, "1000", null];

  for (const answer of answers) {
    // @ts-expect-error A JavaScript clock can answer anything.
    const sample = sampleClock(() => answer);

    expect(sample.timestamp).toBeNull();
    expect(sample.error).toMatchObject({ code: "INVALID_CLOCK" });
  }
});
