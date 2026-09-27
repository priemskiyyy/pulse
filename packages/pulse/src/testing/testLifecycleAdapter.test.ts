import { expect, test, vi } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import { testLifecycleAdapter } from "src/testing/testLifecycleAdapter";
import type { AdapterConformanceHarness } from "src/testing/types/AdapterConformanceHarness";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
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

const CHECK_NAMES = [
  "creates no host subscription before start",
  "reports a valid foreground baseline",
  "maps background and foreground",
  "removes every subscription when cleanup returns",
  "keeps observations independent",
  "cleans up idempotently",
  "stays silent after cleanup",
];

// A tiny host whose listeners the harness can count, for adapters under test.
const createHost = () => {
  let state = FOREGROUND;
  const listeners = new Set<(state: LifecycleState) => void>();

  return {
    listeners,
    read: () => state,
    set: (next: LifecycleState) => {
      state = next;

      for (const listener of [...listeners]) {
        listener(next);
      }
    },
  };
};

const createHostHarness = (
  createAdapter: (host: ReturnType<typeof createHost>) => LifecycleAdapter,
  disposeHost = () => {},
): AdapterConformanceHarness => {
  const host = createHost();

  return {
    adapter: createAdapter(host),
    foreground: () => host.set(FOREGROUND),
    background: () => host.set(BACKGROUND),
    settle: async () => {},
    subscriptionCount: () => host.listeners.size,
    disposeHost,
  };
};

const createCompliantAdapter = (
  host: ReturnType<typeof createHost>,
): LifecycleAdapter => ({
  name: "host",
  observe: (observer: LifecycleObserver) => {
    let closed = false;

    const listener = (state: LifecycleState) => {
      if (!closed) {
        observer.next(state);
      }
    };

    host.listeners.add(listener);
    observer.next(host.read());

    return () => {
      closed = true;
      host.listeners.delete(listener);
    };
  },
});

test("the mock adapter passes every check, in a documented order", async () => {
  const report = await testLifecycleAdapter(() => {
    const mock = createMockAdapter({ initial: FOREGROUND });

    return {
      adapter: mock.adapter,
      foreground: () => mock.emit(FOREGROUND),
      background: () => mock.emit(BACKGROUND),
      settle: async () => {},
      subscriptionCount: () => mock.stats().activeObservations,
      disposeHost: () => {},
    };
  });

  expect(report).toEqual({ passed: CHECK_NAMES });
});

test("an asynchronous harness factory and host operations are awaited", async () => {
  const report = await testLifecycleAdapter(async () => {
    const harness = createHostHarness(createCompliantAdapter);

    return {
      ...harness,
      background: async () => harness.background(),
      foreground: async () => harness.foreground(),
    };
  });

  expect(report.passed).toEqual(CHECK_NAMES);
});

test("a leaking, noisy adapter fails the named checks and every host is still disposed", async () => {
  const disposeHost = vi.fn();

  const leaking = (host: ReturnType<typeof createHost>): LifecycleAdapter => ({
    name: "leaking",
    observe: (observer) => {
      host.listeners.add((state) => observer.next(state));
      observer.next(host.read());

      return () => {};
    },
  });

  const run = testLifecycleAdapter(() =>
    createHostHarness(leaking, disposeHost),
  );

  await expect(run).rejects.toThrow(
    /removes every subscription when cleanup returns: A host subscription remained/,
  );
  await expect(run).rejects.toThrow(/stays silent after cleanup/);
  expect(disposeHost).toHaveBeenCalledTimes(CHECK_NAMES.length);
});

test("an adapter reporting an invalid snapshot fails with a description", async () => {
  const invalid = (): LifecycleAdapter => ({
    name: "invalid",
    observe: (observer) => {
      observer.next({ phase: "background", interaction: "available" });

      return () => {};
    },
  });

  await expect(
    testLifecycleAdapter(() => createHostHarness(invalid)),
  ).rejects.toThrow(
    /reports a valid foreground baseline: After start in a foreground host, the adapter reported unknown\/unknown/,
  );
});

test("a host that fails to dispose is reported with its check", async () => {
  const run = testLifecycleAdapter(() =>
    createHostHarness(createCompliantAdapter, () => {
      throw new Error("host stuck");
    }),
  );

  await expect(run).rejects.toThrow(
    /creates no host subscription before start: disposing the host: host stuck/,
  );
});
