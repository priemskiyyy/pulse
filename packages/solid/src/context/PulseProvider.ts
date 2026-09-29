import type { Pulse } from "@priemskiyyy/pulse";
import { createComponent, createMemo } from "solid-js";
import type { ParentProps } from "solid-js";

import { PulseContext } from "src/context/PulseContext";

/**
 * The Pulse to publish to the tree below.
 *
 * @example
 * ```tsx
 * const props: PulseProviderProps = { pulse, children: <Application /> };
 * ```
 */
export type PulseProviderProps = ParentProps<{
  pulse: Pulse;
}>;

/**
 * Publishes one Pulse to the tree below. It only publishes: it never starts
 * or disposes the Pulse, so start it at bootstrap.
 *
 * @example
 * ```tsx
 * <PulseProvider pulse={pulse}>
 *   <Application />
 * </PulseProvider>
 * ```
 */
export const PulseProvider = (props: PulseProviderProps) =>
  createComponent(PulseContext.Provider, {
    value: createMemo(() => props.pulse),
    get children() {
      return props.children;
    },
  });
