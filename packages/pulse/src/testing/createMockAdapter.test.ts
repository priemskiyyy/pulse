import { expect, test, vi } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { LifecycleState } from "src/types/LifecycleState";

const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "available",
};

const BACKGROUND: LifecycleState = {
  phase: "background",
  interaction: "unavailable",
};

const createObserver = () => {
  const next = vi.fn<(state: LifecycleState) => void>();
  const error = vi.fn<(error: unknown) => void>();
  const observer: LifecycleObserver = { next, error };

  return { observer, next, error };
};

test("each observation reports the unknown baseline by default, duplicates included", () => {
  const mock = createMockAdapter();
  const { observer, next } = createObserver();

  mock.adapter.observe(observer);
  mock.emit({ phase: "unknown", interaction: "unknown" });

  expect(next.mock.calls).toEqual([
    [{ phase: "unknown", interaction: "unknown" }],
    [{ phase: "unknown", interaction: "unknown" }],
  ]);
});

test("observations have independent cleanups and counts, and cleanup is idempotent", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const first = createObserver();
  const second = createObserver();
  const stopFirst = mock.adapter.observe(first.observer);

  mock.adapter.observe(second.observer);
  stopFirst();
  stopFirst();
  mock.emit(BACKGROUND);

  expect(first.next.mock.calls).toEqual([[FOREGROUND]]);
  expect(second.next.mock.calls).toEqual([[FOREGROUND], [BACKGROUND]]);
  expect(mock.stats()).toEqual({
    observationsStarted: 2,
    observationsClosed: 1,
    activeObservations: 1,
  });
  expect(Object.isFrozen(mock.stats())).toBe(true);
});

test("a deferred baseline waits for resolveInitial and never overwrites a newer emit", () => {
  const mock = createMockAdapter({ initial: FOREGROUND, deferInitial: true });
  const early = createObserver();
  const late = createObserver();

  mock.adapter.observe(early.observer);
  expect(early.next).not.toHaveBeenCalled();
  mock.emit(BACKGROUND);
  mock.adapter.observe(late.observer);
  mock.resolveInitial();
  mock.resolveInitial();

  expect(early.next.mock.calls).toEqual([[BACKGROUND]]);
  expect(late.next.mock.calls).toEqual([[BACKGROUND]]);
});

test("a reentrant resolveInitial during an emit cannot publish a stale baseline", () => {
  const mock = createMockAdapter({ initial: FOREGROUND, deferInitial: true });
  const second = createObserver();

  mock.adapter.observe({ next: () => mock.resolveInitial(), error: () => {} });
  mock.adapter.observe(second.observer);
  mock.emit(BACKGROUND);

  expect(second.next.mock.calls).toEqual([[BACKGROUND]]);
});

test("errors reach every open observation and change nothing", () => {
  const mock = createMockAdapter();
  const { observer, error, next } = createObserver();
  const failure = new Error("source failed");

  mock.adapter.observe(observer);
  mock.error(failure);

  expect(error.mock.calls).toEqual([[failure]]);
  expect(next).toHaveBeenCalledTimes(1);
});

test("a closed observation hears nothing, except through the unsafe controls", () => {
  const mock = createMockAdapter();
  const { observer, next, error } = createObserver();
  const failure = new Error("late");

  expect(() => mock.unsafe.emitAfterCleanup(FOREGROUND)).toThrow(
    "The mock adapter has not been observed yet.",
  );

  mock.adapter.observe(observer)();
  mock.emit(FOREGROUND);
  mock.error(failure);
  expect(next).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();

  mock.unsafe.emitAfterCleanup(BACKGROUND);
  mock.unsafe.errorAfterCleanup(failure);
  expect(next).toHaveBeenLastCalledWith(BACKGROUND);
  expect(error.mock.calls).toEqual([[failure]]);
});
