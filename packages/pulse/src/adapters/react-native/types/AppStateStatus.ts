/**
 * Every status React Native's `AppState` reports. `inactive`, `unknown` and
 * `extension` come from iOS; `extension` means the code runs inside an app
 * extension, which has no app lifecycle to observe.
 *
 * @example
 * ```ts
 * const status: AppStateStatus = AppState.currentState;
 * ```
 */
export type AppStateStatus =
  "active" | "background" | "inactive" | "unknown" | "extension";
