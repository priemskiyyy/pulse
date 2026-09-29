import type { ComputedRef, InjectionKey } from "vue";

import type { Pulse } from "src/utils/Pulse";

export const PULSE_CONTEXT: InjectionKey<ComputedRef<Pulse>> = Symbol("pulse");
