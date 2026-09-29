// @vitest-environment jsdom
import { createApp, defineComponent, h, shallowRef } from "vue";
import type { Ref } from "vue";
import { expect, test } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import type { LifecycleSource } from "src/types/LifecycleSource";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";
import { PulseProvider } from "src/vue/PulseProvider";
import { useLifecycle } from "src/vue/useLifecycle";
import { usePulse } from "src/vue/usePulse";

const createPulse = () => {
  const mock = createMockAdapter({
    initial: { phase: "foreground", interaction: "available" },
  });

  const pulse = new Pulse({ adapter: mock.adapter });

  return { mock, pulse };
};

// Mounts a component whose setup runs `read`, under a provider when one is given.
const mount = <TValue>(read: () => TValue, pulse?: Ref<Pulse>) => {
  let value: TValue | undefined;

  const Probe = defineComponent(() => {
    value = read();

    return () => null;
  });

  const Root = defineComponent(() => () => {
    if (pulse === undefined) {
      return h(Probe);
    }

    return h(PulseProvider, { pulse: pulse.value }, () => h(Probe));
  });

  const app = createApp(Root);

  app.config.warnHandler = () => {};

  app.mount(document.createElement("div"));

  return { value, unmount: app.unmount };
};

test("R-001 R-003 useLifecycle reads unknown in setup, then follows the source, and unmounting only unsubscribes", () => {
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

  const { value, unmount } = mount(() => {
    const state = useLifecycle(source);

    initial = state.value;

    return state;
  });

  expect(initial).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(value?.value.phase).toBe("foreground");

  mock.emit({ phase: "background", interaction: "unavailable" });

  expect(value?.value.phase).toBe("background");
  expect(subscriptions).toBe(1);

  unmount();

  expect(subscriptions).toBe(0);
  expect(mock.stats().activeObservations).toBe(1);
});

test("R-019 useLifecycle and usePulse read the provider's Pulse and follow a new one", async () => {
  const first = createPulse();
  const second = createPulse();

  first.pulse.start();
  second.pulse.start();
  second.mock.emit({ phase: "background", interaction: "unavailable" });

  const pulse = shallowRef(first.pulse);

  const { value, unmount } = mount(
    () => ({ state: useLifecycle(), pulse: usePulse() }),
    pulse,
  );

  expect(value?.state.value.phase).toBe("foreground");
  expect(value?.pulse.value).toBe(first.pulse);

  pulse.value = second.pulse;
  await Promise.resolve();

  expect(value?.state.value.phase).toBe("background");
  expect(value?.pulse.value).toBe(second.pulse);

  unmount();
});

test("R-019 a passed source wins over the provider's Pulse", () => {
  const provided = createPulse();
  const passed = createPulse();

  provided.pulse.start();

  const { value, unmount } = mount(
    () => useLifecycle(passed.pulse),
    shallowRef(provided.pulse),
  );

  expect(value?.value).toBe(UNKNOWN_LIFECYCLE_STATE);

  unmount();
});

test("R-020 without a provider, usePulse and a sourceless useLifecycle throw INVALID_CONFIGURATION", () => {
  const invalid = expect.objectContaining({
    name: "PulseError",
    code: "INVALID_CONFIGURATION",
  });

  expect(() => mount(() => usePulse())).toThrow(invalid);
  expect(() => mount(() => useLifecycle())).toThrow(invalid);
});

test("R-021 the provider starts nothing and disposes nothing", () => {
  const { mock, pulse } = createPulse();

  const { unmount } = mount(() => useLifecycle(), shallowRef(pulse));

  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);

  unmount();
  pulse.start();

  expect(pulse.state.get().phase).toBe("foreground");
  expect(mock.stats().activeObservations).toBe(1);
});
