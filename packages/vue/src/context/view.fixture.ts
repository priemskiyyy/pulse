import { Pulse } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";
import { createSSRApp, defineComponent, h } from "vue";

import { useLifecycle } from "src/composables/useLifecycle";
import { PulseProvider } from "src/context/PulseProvider";

// A Pulse over a foreground host, and a view that reads it below a provider.
export const createView = () => {
  const mock = createMockAdapter({
    initial: { phase: "foreground", interaction: "available" },
  });

  const pulse = new Pulse({ adapter: mock.adapter });

  const View = defineComponent(() => {
    const state = useLifecycle();

    return () => h("span", `${state.value.phase}/${state.value.interaction}`);
  });

  const createApp = () =>
    createSSRApp(() => h(PulseProvider, { pulse }, () => h(View)));

  return { mock, pulse, createApp };
};
