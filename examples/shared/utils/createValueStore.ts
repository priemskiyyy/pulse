import type { ValueStore } from "example-shared/types/ValueStore";

export const createValueStore = <T>(initial: T): ValueStore<T> => {
  const listeners = new Set<() => void>();
  let value = initial;

  return {
    get: () => value,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    set: (next) => {
      if (Object.is(next, value)) {
        return;
      }

      value = next;

      for (const listener of listeners) {
        listener();
      }
    },
  };
};
