import { computed, defineComponent, provide } from "vue";

import { PULSE_CONTEXT } from "src/vue/PulseContext";
import type { Pulse } from "src/utils/Pulse";

/**
 * The Pulse to publish to the components below.
 *
 * @example
 * ```ts
 * const props: PulseProviderProps = { pulse };
 * ```
 */
export type PulseProviderProps = {
  pulse: Pulse;
};

/**
 * Publishes one Pulse to the components below. It only publishes: it never
 * starts or disposes the Pulse, so start it at bootstrap.
 *
 * @example
 * ```vue
 * <PulseProvider :pulse="pulse">
 *   <Application />
 * </PulseProvider>
 * ```
 */
export const PulseProvider = defineComponent(
  (props: PulseProviderProps, { slots }) => {
    provide(
      PULSE_CONTEXT,
      computed(() => props.pulse),
    );

    return () => slots.default?.();
  },
  { name: "PulseProvider", props: { pulse: { type: Object, required: true } } },
);
