import type { AppStateClassification } from "src/adapters/react-native/types/internal/AppStateClassification";
import type { AppStateStatus } from "src/adapters/react-native/types/AppStateStatus";
import type { ReactNativeOptions } from "src/adapters/react-native/types/ReactNativeOptions";
import {
  ANDROID_CLASSIFICATIONS,
  IOS_CLASSIFICATIONS,
} from "src/adapters/react-native/utils/constants/classifications";
import {
  ACTIVE_STATE,
  BACKGROUND_STATE,
  INACTIVE_STATE,
  UNKNOWN_STATE,
} from "src/adapters/react-native/utils/constants/states";
import type { InteractionState } from "src/types/InteractionState";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";

/**
 * Observes React Native's `AppState`. On iOS, `active` is foreground and
 * available and `inactive` foreground and unavailable; on Android, `active` is
 * foreground with interaction unknown until a `focus` or `blur` arrives after
 * the last background or unknown. `unknown` and `extension` are unknown on
 * both axes, and on any other platform, the web included, the adapter is
 * unavailable.
 *
 * @example
 * ```ts
 * import { AppState, Platform } from "react-native";
 *
 * const pulse = new Pulse({
 *   adapter: reactNative({ appState: AppState, platform: Platform.OS }),
 * });
 * ```
 */
export const reactNative = ({
  appState,
  platform,
}: ReactNativeOptions): LifecycleAdapter => ({
  name: "react-native",
  available: () => {
    if (!appState.isAvailable) {
      return false;
    }

    if (platform === "ios") {
      return true;
    }

    if (platform === "android") {
      return true;
    }

    // The web belongs to browser(), and other platforms have no mapping here.
    return false;
  },
  observe: (observer) => {
    const classifications =
      platform === "ios" ? IOS_CLASSIFICATIONS : ANDROID_CLASSIFICATIONS;

    let closed = false;
    let receivedChange = false;
    let classification: AppStateClassification = "UNINITIALIZED";
    // Android focus evidence, valid only since the last background or unknown app state.
    let focus: InteractionState = "unknown";
    const subscriptions: Array<{ remove: () => void }> = [];

    const publish = () => {
      if (classification === "ACTIVE") {
        if (platform === "ios") {
          observer.next(ACTIVE_STATE);

          return;
        }

        observer.next({ phase: "foreground", interaction: focus });

        return;
      }

      if (classification === "INACTIVE") {
        observer.next(INACTIVE_STATE);

        return;
      }

      if (classification === "BACKGROUND") {
        observer.next(BACKGROUND_STATE);

        return;
      }

      observer.next(UNKNOWN_STATE);
    };

    // A repeated background keeps focus that arrived for the next active.
    const isStaleFocusBoundary = (next: AppStateClassification) => {
      if (next === classification) {
        return false;
      }

      if (next === "BACKGROUND") {
        return true;
      }

      return next === "UNKNOWN";
    };

    const accept = (status: AppStateStatus | null) => {
      const next = status === null ? "UNKNOWN" : classifications[status];

      if (isStaleFocusBoundary(next)) {
        focus = "unknown";
      }

      classification = next;
      publish();
    };

    const handleChange = (status: AppStateStatus) => {
      if (closed) {
        return;
      }

      receivedChange = true;
      accept(status);
    };

    const handleFocus = () => {
      if (closed) {
        return;
      }

      focus = "available";
      publish();
    };

    const handleBlur = () => {
      if (closed) {
        return;
      }

      focus = "unavailable";
      publish();
    };

    subscriptions.push(appState.addEventListener("change", handleChange));

    if (platform === "android") {
      subscriptions.push(appState.addEventListener("focus", handleFocus));
      subscriptions.push(appState.addEventListener("blur", handleBlur));
    }

    // The change listener is in place first, so a change during the read wins over it.
    if (!receivedChange) {
      const baseline = appState.currentState;

      if (!receivedChange) {
        accept(baseline);
      }
    }

    return () => {
      if (closed) {
        return;
      }

      closed = true;

      for (const subscription of subscriptions.reverse()) {
        subscription.remove();
      }
    };
  },
});
