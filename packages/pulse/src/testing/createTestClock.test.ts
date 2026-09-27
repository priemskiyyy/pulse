import { expect, test } from "vitest";

import { createTestClock } from "src/testing/createTestClock";

test("the clock starts where it is told and moves only when asked", () => {
  const clock = createTestClock(1_000);
  const { now } = clock;

  expect(now()).toBe(1_000);
  clock.advance(0);
  clock.advance(4_500);
  expect(now()).toBe(5_500);
  clock.set(2_000);
  expect(now()).toBe(2_000);
  expect(createTestClock().now()).toBe(0);
});

test("invalid arguments throw a RangeError and leave the clock unchanged", () => {
  const clock = createTestClock(Number.MAX_VALUE);

  expect(() => clock.advance(-1)).toThrow(RangeError);
  expect(() => clock.advance(NaN)).toThrow(RangeError);
  expect(() => clock.advance(Infinity)).toThrow(RangeError);
  expect(() => clock.advance(Number.MAX_VALUE)).toThrow(RangeError);
  expect(() => clock.set(Infinity)).toThrow(RangeError);
  // @ts-expect-error A JavaScript caller can pass a string.
  expect(() => clock.set("5")).toThrow(RangeError);
  expect(clock.now()).toBe(Number.MAX_VALUE);
  expect(() => createTestClock(NaN)).toThrow(RangeError);
});
