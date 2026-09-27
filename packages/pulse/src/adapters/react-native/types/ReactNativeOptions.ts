import type { AppStateLike } from "src/adapters/react-native/types/AppStateLike";

/**
 * The React Native sources the adapter borrows: `AppState` and the value of
 * `Platform.OS`. Only `ios` and `android` are mapped; `web` belongs to
 * `browser()`.
 *
 * @example
 * ```ts
 * const options: ReactNativeOptions = { appState: AppState, platform: Platform.OS };
 * ```
 */
export type ReactNativeOptions = {
  appState: AppStateLike;
  platform: string;
};
