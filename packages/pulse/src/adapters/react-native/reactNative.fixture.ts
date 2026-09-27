import type { AppStateLike } from "src/adapters/react-native/types/AppStateLike";

type EventType = "change" | "focus" | "blur";

// A borrowed AppState whose subscriptions a test can count, drive and break.
export const createAppState = (initial: string | null | undefined) => {
  const listeners: Record<EventType, Set<(state: string) => void>> = {
    change: new Set(),
    focus: new Set(),
    blur: new Set(),
  };

  const faults: {
    subscribe: ((type: EventType) => void) | null;
    remove: ((type: EventType) => void) | null;
  } = { subscribe: null, remove: null };

  const appState: AppStateLike = {
    currentState: initial,
    isAvailable: true,
    addEventListener: (type, listener) => {
      faults.subscribe?.(type);

      const entry = (state: string) => listener(state);

      listeners[type].add(entry);

      return {
        remove: () => {
          faults.remove?.(type);
          listeners[type].delete(entry);
        },
      };
    },
  };

  const emit = (type: EventType, state: string) => {
    for (const listener of [...listeners[type]]) {
      listener(state);
    }
  };

  return {
    appState,
    listeners,
    faults,
    change: (state: string) => {
      appState.currentState = state;
      emit("change", state);
    },
    focus: () => emit("focus", ""),
    blur: () => emit("blur", ""),
    subscriptionCount: () =>
      listeners.change.size + listeners.focus.size + listeners.blur.size,
  };
};
