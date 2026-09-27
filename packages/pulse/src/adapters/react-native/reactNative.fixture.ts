import type { AppStateLike } from "src/adapters/react-native/types/AppStateLike";
import type { AppStateStatus } from "src/adapters/react-native/types/AppStateStatus";

type EventType = "change" | "focus" | "blur";

// A borrowed AppState whose subscriptions a test can count and drive.
export const createAppState = (initial: AppStateStatus | null) => {
  const listeners: Record<EventType, Set<(status: AppStateStatus) => void>> = {
    change: new Set(),
    focus: new Set(),
    blur: new Set(),
  };

  // A test sets this to act while the adapter is still subscribing.
  const hooks: { subscribe: ((type: EventType) => void) | null } = {
    subscribe: null,
  };

  const appState: AppStateLike = {
    currentState: initial,
    isAvailable: true,
    addEventListener: (type, listener) => {
      hooks.subscribe?.(type);

      const entry = (status: AppStateStatus) => listener(status);

      listeners[type].add(entry);

      return {
        remove: () => {
          listeners[type].delete(entry);
        },
      };
    },
  };

  const emit = (type: EventType, status: AppStateStatus) => {
    for (const listener of [...listeners[type]]) {
      listener(status);
    }
  };

  return {
    appState,
    listeners,
    hooks,
    change: (status: AppStateStatus) => {
      appState.currentState = status;
      emit("change", status);
    },
    focus: () => emit("focus", "active"),
    blur: () => emit("blur", "active"),
    subscriptionCount: () =>
      listeners.change.size + listeners.focus.size + listeners.blur.size,
  };
};
