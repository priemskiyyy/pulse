import type { Pulse } from "@priemskiyyy/pulse";
import type { ComputedRef, InjectionKey } from "vue";

export const PULSE_CONTEXT: InjectionKey<ComputedRef<Pulse>> = Symbol("pulse");
