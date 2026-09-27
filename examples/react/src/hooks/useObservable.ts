import type { ObservableValue } from "@priemskiyyy/pulse";
import { useSyncExternalStore } from "react";

export const useObservable = <T>(observable: ObservableValue<T>) =>
  useSyncExternalStore(observable.subscribe, observable.get, observable.get);
