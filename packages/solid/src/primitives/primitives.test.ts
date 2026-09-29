import { Pulse, UNKNOWN_LIFECYCLE_STATE } from "@priemskiyyy/pulse";
import type { LifecycleSource, LifecycleState } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";
import { createComponent, createRoot, createSignal } from "solid-js";
import type { Accessor } from "solid-js";
import { expect, test } from "vitest";

import { PulseProvider } from "src/context/PulseProvider";
import { useLifecycle } from "src/primitives/useLifecycle";
import { usePulse } from "src/primitives/usePulse";

const createPulse = () => {
  const mock = createMockAdapter({
    initial: { phase: "foreground", interaction: "available" },
  });

  const pulse = new Pulse({ adapter: mock.adapter });

  return { mock, pulse };
};

// Runs a component body under a provider, the way Solid mounts one.
const mountWithProvider = <TValue>(
  pulse: Accessor<Pulse>,
  read: () => TValue,
) => {
  let value: TValue | undefined;

  const dispose = createRoot((disposeRoot) => {
    createComponent(PulseProvider, {
      get pulse() {
        return pulse();
      },
      get children() {
        value = read();

        return undefined;
      },
    });

    return disposeRoot;
  });

  return { value, dispose };
};

test("R-001 R-003 useLifecycle reads unknown until mounted, then follows the source, and unmounting only unsubscribes", () => {
  const { mock, pulse } = createPulse();
  let subscriptions = 0;

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

  let initial: LifecycleState | undefined;

  const { state, dispose } = createRoot((disposeRoot) => {
    const read = useLifecycle(source);

    initial = read();

    return { state: read, dispose: disposeRoot };
  });

  expect(initial).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(state().phase).toBe("foreground");

  mock.emit({ phase: "background", interaction: "unavailable" });

  expect(state().phase).toBe("background");
  expect(subscriptions).toBe(1);

  dispose();

  expect(subscriptions).toBe(0);
  expect(mock.stats().activeObservations).toBe(1);
});

test("R-019 useLifecycle and usePulse read the provider's Pulse and follow a new one", () => {
  const first = createPulse();
  const second = createPulse();

  first.pulse.start();
  second.pulse.start();
  second.mock.emit({ phase: "background", interaction: "unavailable" });

  const [pulse, setPulse] = createSignal(first.pulse);

  const { value, dispose } = mountWithProvider(pulse, () => ({
    state: useLifecycle(),
    pulse: usePulse(),
  }));

  expect(value?.state().phase).toBe("foreground");
  expect(value?.pulse()).toBe(first.pulse);

  setPulse(second.pulse);

  expect(value?.state().phase).toBe("background");
  expect(value?.pulse()).toBe(second.pulse);

  dispose();
});

test("R-019 a passed source wins over the provider's Pulse", () => {
  const provided = createPulse();
  const passed = createPulse();

  provided.pulse.start();

  const { value, dispose } = mountWithProvider(
    () => provided.pulse,
    () => useLifecycle(passed.pulse),
  );

  expect(value?.()).toBe(UNKNOWN_LIFECYCLE_STATE);

  dispose();
});

test("R-020 without a provider, usePulse and a sourceless useLifecycle throw INVALID_CONFIGURATION", () => {
  const invalid = expect.objectContaining({
    name: "PulseError",
    code: "INVALID_CONFIGURATION",
  });

  expect(() => createRoot(() => usePulse())).toThrow(invalid);
  expect(() => createRoot(() => useLifecycle())).toThrow(invalid);
});

test("R-021 the provider starts nothing and disposes nothing", () => {
  const { mock, pulse } = createPulse();

  const { dispose } = mountWithProvider(
    () => pulse,
    () => useLifecycle(),
  );

  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);

  dispose();
  pulse.start();

  expect(pulse.state.get().phase).toBe("foreground");
  expect(mock.stats().activeObservations).toBe(1);
});
