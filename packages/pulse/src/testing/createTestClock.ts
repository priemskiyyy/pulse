import type { TestClock } from "src/testing/types/TestClock";

const assertFinite = (value: number, message: string) => {
  if (!Number.isFinite(value)) {
    throw new RangeError(message);
  }
};

/**
 * Creates a manual clock that starts at finite epoch milliseconds, zero by
 * default. Invalid arguments throw a `RangeError` and leave it unchanged; to
 * test a throwing or NaN clock, pass your own `now` to Pulse.
 *
 * @example
 * ```ts
 * const clock = createTestClock(1_000);
 *
 * clock.advance(4_500);
 * clock.now(); // 5_500
 * ```
 */
export const createTestClock = (initialEpochMilliseconds = 0): TestClock => {
  assertFinite(
    initialEpochMilliseconds,
    "A test clock starts at finite epoch milliseconds.",
  );

  let current = initialEpochMilliseconds;

  return Object.freeze({
    now: () => current,
    advance: (milliseconds: number) => {
      assertFinite(milliseconds, "advance() needs finite milliseconds.");

      if (milliseconds < 0) {
        throw new RangeError(
          "advance() moves forward only; use set() for an earlier time.",
        );
      }

      const next = current + milliseconds;

      assertFinite(next, "advance() would leave the finite range.");
      current = next;
    },
    set: (epochMilliseconds: number) => {
      assertFinite(epochMilliseconds, "set() needs finite epoch milliseconds.");
      current = epochMilliseconds;
    },
  });
};
