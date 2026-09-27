import type { ObservableValue } from "@priemskiyyy/pulse";

export type ValueStore<T> = ObservableValue<T> & { set: (next: T) => void };
