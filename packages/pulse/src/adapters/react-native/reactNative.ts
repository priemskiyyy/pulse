import {
  ACTIVE_STATE,
  BACKGROUND_STATE,
  INACTIVE_STATE,
  UNKNOWN_STATE,
} from "src/adapters/react-native/utils/constants/states";
import type { ReactNativeOptions } from "src/adapters/react-native/types/ReactNativeOptions";
import type { InteractionState } from "src/types/InteractionState";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";

type Classification =
  "UNINITIALIZED" | "ACTIVE" | "INACTIVE" | "BACKGROUND" | "UNKNOWN";

/**
 * Observes React Native's `AppState`. On iOS, `active` is foreground and
 * available and `inactive` foreground and unavailable; on Android, `active` is
 * foreground with interaction unknown until a `focus` or `blur` arrives after
 * the last background or unknown. Anything unrecognized is unknown on both axes.
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
  observe: (observer) => {
    if (platform === "web") {
      throw new Error(
        'React Native reports the platform "web": observe the document with browser() from "@priemskiyyy/pulse/browser" instead.',
      );
    }

    if (platform !== "ios" && platform !== "android") {
      throw new Error(
        `Pulse maps AppState on ios and android only, not "${platform}"; write a custom adapter with its own mapping.`,
      );
    }

    if (
      typeof appState !== "object" ||
      appState === null ||
      appState.isAvailable === false ||
      typeof appState.addEventListener !== "function"
    ) {
      throw new Error("React Native's AppState is not available to observe.");
    }

    let closed = false;
    let receivedChange = false;
    let classification: Classification = "UNINITIALIZED";
    // Android focus evidence, valid only since the last background or unknown app state.
    let focus: InteractionState = "unknown";
    const subscriptions: Array<{ remove: () => void }> = [];

    const publish = () => {
      if (classification === "ACTIVE") {
        observer.next(
          platform === "ios"
            ? ACTIVE_STATE
            : { phase: "foreground", interaction: focus },
        );

        return;
      }

      if (classification === "INACTIVE") {
        observer.next(INACTIVE_STATE);

        return;
      }

      observer.next(
        classification === "BACKGROUND" ? BACKGROUND_STATE : UNKNOWN_STATE,
      );
    };

    const accept = (value: unknown) => {
      let next: Classification = "UNKNOWN";

      if (value === "active") {
        next = "ACTIVE";
      }

      if (value === "background") {
        next = "BACKGROUND";
      }

      // Only iOS documents inactive; on Android it is outside the mapping.
      if (value === "inactive" && platform === "ios") {
        next = "INACTIVE";
      }

      // A distinct move into background or unknown makes earlier focus evidence stale.
      if (
        next !== classification &&
        (next === "BACKGROUND" || next === "UNKNOWN")
      ) {
        focus = "unknown";
      }

      classification = next;
      publish();
    };

    const subscribe = (
      type: "change" | "focus" | "blur",
      listener: (state: string) => void,
    ) => {
      const subscription = appState.addEventListener(type, listener);

      if (typeof subscription?.remove !== "function") {
        throw new Error(
          `AppState answered no removable subscription for "${type}".`,
        );
      }

      subscriptions.push(subscription);
    };

    const removeAll = () => {
      const failures: unknown[] = [];

      for (const subscription of subscriptions.reverse()) {
        try {
          subscription.remove();
        } catch (error) {
          failures.push(error);
        }
      }

      subscriptions.length = 0;

      return failures;
    };

    try {
      subscribe("change", (state) => {
        if (closed) {
          return;
        }

        receivedChange = true;
        accept(state);
      });

      if (platform === "android") {
        subscribe("focus", () => {
          if (!closed) {
            focus = "available";
            publish();
          }
        });
        subscribe("blur", () => {
          if (!closed) {
            focus = "unavailable";
            publish();
          }
        });
      }

      // The listener is in place first, so a change during the read wins over it.
      if (!receivedChange) {
        const baseline = appState.currentState;

        if (!closed && !receivedChange) {
          accept(baseline);
        }
      }
    } catch (error) {
      closed = true;

      const failures = removeAll();

      if (failures.length > 0) {
        throw new AggregateError(
          [error, ...failures],
          "Observing AppState failed, and so did removing its subscriptions.",
        );
      }

      throw error;
    }

    return () => {
      if (closed) {
        return;
      }

      closed = true;

      const failures = removeAll();

      if (failures.length > 0) {
        throw new AggregateError(
          failures,
          "Removing the AppState subscriptions failed.",
        );
      }
    };
  },
});
