import type { AppStateClassification } from "src/adapters/react-native/types/internal/AppStateClassification";
import type { AppStateStatus } from "src/adapters/react-native/types/AppStateStatus";
import type { ReactNativeOptions } from "src/adapters/react-native/types/ReactNativeOptions";
import {
  ANDROID_CLASSIFICATIONS,
  IOS_CLASSIFICATIONS,
} from "src/adapters/react-native/utils/constants/classifications";
import { CLASSIFICATION_STATES } from "src/adapters/react-native/utils/constants/states";
import type { InteractionState } from "src/types/InteractionState";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import { LIFECYCLE_STATES } from "src/utils/constants/states";
import { removeAll, rollBack } from "src/utils/internal/cleanup/removeAll";

/**
 * Observes React Native's `AppState` on iOS and Android; an Android `active`
 * has interaction unknown until a `focus` or `blur`. Every other platform, the
 * web included, is unavailable.
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
    let changedBeforeBaseline = false;
    let classification: AppStateClassification = "UNINITIALIZED";
    // Android focus evidence, valid only since the last background or unknown app state.
    let focus: InteractionState = "unknown";
    const removals: Array<() => void> = [];

    const publish = () => {
      if (classification !== "ACTIVE") {
        observer.next(CLASSIFICATION_STATES[classification]);

        return;
      }

      if (platform === "ios") {
        observer.next(LIFECYCLE_STATES.foreground.available);

        return;
      }

      observer.next(LIFECYCLE_STATES.foreground[focus]);
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

    // hasOwnProperty rather than Object.hasOwn, which older Hermes engines lack.
    const isStatus = (status: string): status is AppStateStatus =>
      Object.prototype.hasOwnProperty.call(classifications, status);

    // React Native can add a status before its types do, so anything unmapped is no evidence.
    const classify = (status: string | null | undefined) => {
      if (status === null || status === undefined || !isStatus(status)) {
        return "UNKNOWN";
      }

      return classifications[status];
    };

    const accept = (status: string | null | undefined) => {
      const next = classify(status);

      if (isStaleFocusBoundary(next)) {
        focus = "unknown";
      }

      classification = next;
      publish();
    };

    const handleChange = (status?: AppStateStatus) => {
      if (closed) {
        return;
      }

      changedBeforeBaseline = true;
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

    const listen = (
      type: "change" | "focus" | "blur",
      handler: (status?: AppStateStatus) => void,
    ) => {
      const subscription = appState.addEventListener(type, handler);

      removals.push(() => subscription.remove());
    };

    try {
      listen("change", handleChange);

      if (platform === "android") {
        listen("focus", handleFocus);
        listen("blur", handleBlur);
      }

      // The change listener is in place first, so a change during the read wins over it.
      const baseline = appState.currentState;

      if (!changedBeforeBaseline) {
        accept(baseline);
      }
    } catch (error) {
      closed = true;
      rollBack(removals, error);
    }

    return () => {
      if (closed) {
        return;
      }

      closed = true;
      removeAll(removals);
    };
  },
});
