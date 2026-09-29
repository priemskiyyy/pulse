import { flushSync, mount, unmount } from "svelte";
import { expect, test } from "vitest";

import Probe from "src/svelte/Probe.fixture.svelte";
import { useLifecycle } from "src/svelte/useLifecycle";
import { usePulse } from "src/svelte/usePulse";
import { createMockAdapter } from "src/testing/createMockAdapter";
import type { LifecycleSource } from "src/types/LifecycleSource";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";

const createPulse = () => {
  const mock = createMockAdapter({
    initial: { phase: "foreground", interaction: "available" },
  });

  const pulse = new Pulse({ adapter: mock.adapter });

  return { mock, pulse };
};

// Mounts a component that runs `read` while it initializes, below `pulse` when one is given.
const render = <TValue>(read: () => TValue, pulse?: Pulse) => {
  let value: TValue | undefined;

  const component = mount(Probe, {
    target: document.createElement("div"),
    props: {
      pulse,
      read: () => {
        value = read();
      },
    },
  });

  flushSync();

  return { value, unmount: () => unmount(component) };
};

test("R-001 R-003 useLifecycle reads unknown while initializing, then follows the source, and unmounting only unsubscribes", () => {
  const { mock, pulse } = createPulse();
  let subscriptions = 0;
  let initial: LifecycleState | undefined;

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

  const { value, unmount: unmountProbe } = render(() => {
    const lifecycle = useLifecycle(source);

    initial = lifecycle.current;

    return lifecycle;
  });

  expect(initial).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(value?.current.phase).toBe("foreground");

  mock.emit({ phase: "background", interaction: "unavailable" });

  expect(value?.current.phase).toBe("background");
  expect(subscriptions).toBe(1);

  unmountProbe();

  expect(subscriptions).toBe(0);
  expect(mock.stats().activeObservations).toBe(1);
});

test("R-019 useLifecycle and usePulse read the Pulse from setPulseContext", () => {
  const { pulse } = createPulse();

  pulse.start();

  const { value, unmount: unmountProbe } = render(
    () => ({ lifecycle: useLifecycle(), pulse: usePulse() }),
    pulse,
  );

  expect(value?.lifecycle.current.phase).toBe("foreground");
  expect(value?.pulse).toBe(pulse);

  unmountProbe();
});

test("R-019 a passed source wins over the context's Pulse", () => {
  const provided = createPulse();
  const passed = createPulse();

  provided.pulse.start();

  const { value, unmount: unmountProbe } = render(
    () => useLifecycle(passed.pulse),
    provided.pulse,
  );

  expect(value?.current).toBe(UNKNOWN_LIFECYCLE_STATE);

  unmountProbe();
});

test("R-020 without a context, usePulse and a sourceless useLifecycle throw INVALID_CONFIGURATION", () => {
  const invalid = expect.objectContaining({
    name: "PulseError",
    code: "INVALID_CONFIGURATION",
  });

  expect(() => render(() => usePulse())).toThrow(invalid);
  expect(() => render(() => useLifecycle())).toThrow(invalid);
});

test("R-021 setPulseContext starts nothing and disposes nothing", () => {
  const { mock, pulse } = createPulse();

  const { unmount: unmountProbe } = render(() => useLifecycle(), pulse);

  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);

  unmountProbe();
  pulse.start();

  expect(pulse.state.get().phase).toBe("foreground");
  expect(mock.stats().activeObservations).toBe(1);
});
