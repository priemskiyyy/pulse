import { Pulse, UNKNOWN_LIFECYCLE_STATE } from "@priemskiyyy/pulse";
import type { LifecycleSource, LifecycleState } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";
import { cleanup, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { afterEach, expect, test } from "vitest";

import type { ReadableValue } from "../types/ReadableValue.js";
import { useLifecycle } from "./useLifecycle.svelte.js";
import { usePulse } from "./usePulse.js";
import View from "./View.fixture.svelte";
import ViewHarness from "./ViewHarness.fixture.svelte";

afterEach(cleanup);

const createPulse = () => {
  const mock = createMockAdapter({
    initial: { phase: "foreground", interaction: "available" },
  });

  const pulse = new Pulse({ adapter: mock.adapter });

  return { mock, pulse };
};

test("R-001 R-003 useLifecycle reads unknown while initializing, then follows the source, and unmounting only unsubscribes", () => {
  const { mock, pulse } = createPulse();
  let subscriptions = 0;
  let initial: LifecycleState | undefined;
  let lifecycle: ReadableValue<LifecycleState> | undefined;

  pulse.start();

  const source: LifecycleSource = {
    state: {
      get: pulse.state.get,
      subscribe: (listener) => {
        const stop = pulse.state.subscribe(listener);

        subscriptions += 1;

        return () => {
          subscriptions -= 1;
          stop();
        };
      },
    },
  };

  const { unmount } = render(View, {
    read: () => {
      lifecycle = useLifecycle(source);
      initial = lifecycle.current;
    },
  });

  flushSync();

  expect(initial).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(lifecycle?.current.phase).toBe("foreground");

  mock.emit({ phase: "background", interaction: "unavailable" });

  expect(lifecycle?.current.phase).toBe("background");
  expect(subscriptions).toBe(1);

  unmount();

  expect(subscriptions).toBe(0);
  expect(mock.stats().activeObservations).toBe(1);
});

test("R-019 useLifecycle and usePulse read the provider's Pulse and follow a new one", async () => {
  const first = createPulse();
  const second = createPulse();
  let lifecycle: ReadableValue<LifecycleState> | undefined;
  let provided: ReadableValue<Pulse> | undefined;

  first.pulse.start();
  second.pulse.start();
  second.mock.emit({ phase: "background", interaction: "unavailable" });

  const { rerender } = render(ViewHarness, {
    pulse: first.pulse,
    read: () => {
      lifecycle = useLifecycle();
      provided = usePulse();
    },
  });

  flushSync();

  expect(lifecycle?.current.phase).toBe("foreground");
  expect(provided?.current).toBe(first.pulse);

  await rerender({ pulse: second.pulse });
  flushSync();

  expect(lifecycle?.current.phase).toBe("background");
  expect(provided?.current).toBe(second.pulse);
});

test("R-019 a passed source wins over the provider's Pulse", () => {
  const provided = createPulse();
  const passed = createPulse();
  let lifecycle: ReadableValue<LifecycleState> | undefined;

  provided.pulse.start();

  render(ViewHarness, {
    pulse: provided.pulse,
    read: () => {
      lifecycle = useLifecycle(passed.pulse);
    },
  });

  flushSync();

  expect(lifecycle?.current).toBe(UNKNOWN_LIFECYCLE_STATE);
});

test("R-020 without a provider, usePulse and a sourceless useLifecycle throw INVALID_CONFIGURATION", () => {
  const invalid = expect.objectContaining({
    name: "PulseError",
    code: "INVALID_CONFIGURATION",
  });

  expect(() => render(View, { read: () => usePulse() })).toThrow(invalid);
  expect(() => render(View, { read: () => useLifecycle() })).toThrow(invalid);
});

test("R-021 the provider starts nothing and disposes nothing", () => {
  const { mock, pulse } = createPulse();

  const { unmount } = render(ViewHarness, {
    pulse,
    read: () => useLifecycle(),
  });

  flushSync();

  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);

  unmount();
  pulse.start();

  expect(pulse.state.get().phase).toBe("foreground");
  expect(mock.stats().activeObservations).toBe(1);
});
