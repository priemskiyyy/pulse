/**
 * A manual clock for tests: `now` answers the current epoch milliseconds, and
 * only `advance` and `set` move it. It creates no timer.
 *
 * @example
 * ```ts
 * const clock: TestClock = createTestClock(1_000);
 * const pulse = new Pulse({ adapter, now: clock.now });
 * ```
 */
export type TestClock = {
  now: () => number;
  /** Moves forward by finite, nonnegative milliseconds. */
  advance: (milliseconds: number) => void;
  /** Jumps to finite epoch milliseconds, earlier ones included, to test a rollback. */
  set: (epochMilliseconds: number) => void;
};
