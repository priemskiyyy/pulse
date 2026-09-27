---
description: "The React Native adapter maps AppState on iOS and Android, including inactive, extension and Android focus evidence, without importing React Native."
---

# React Native

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { reactNative } from "@priemskiyyy/pulse/react-native";
import { AppState, Platform } from "react-native";

export const pulse = new Pulse({
  adapter: reactNative({ appState: AppState, platform: Platform.OS }),
});
```

Pulse never imports React Native: the application passes `AppState` and `Platform.OS` in. The adapter is available on `ios` and `android` when `AppState.isAvailable` is true. On the web, or any other platform, it is unavailable and the state stays unknown; use [the browser adapter](browser.md) there.

## Mapping

| `AppState`            | iOS                      | Android                                      |
| --------------------- | ------------------------ | -------------------------------------------- |
| `active`              | foreground / available   | foreground / unknown until `focus` or `blur` |
| `inactive`            | foreground / unavailable | unknown / unknown                            |
| `background`          | background / unavailable | background / unavailable                     |
| `unknown`, unresolved | unknown / unknown        | unknown / unknown                            |
| `extension`           | unknown / unknown        | unknown / unknown                            |

The statuses are typed exhaustively, so a status React Native adds fails to compile until it has a mapping. `extension` means the code runs inside an app extension, which has no app lifecycle to observe.

An iOS interruption, `active`, `inactive`, `active`, changes interaction only. `inactive` then `background` is one background event, at background. `background`, `inactive`, `active` enters foreground at `inactive`.

## Why interaction is unknown on Android

Android reports `focus` and `blur` separately from its app state and offers no current-focus reading. The adapter keeps focus evidence only since the last distinct move into background or unknown: focus before a departure never counts for the next `active`, a repeated `background` keeps focus that arrived for the next `active`, and the notification drawer changes interaction without changing phase. Until fresh evidence arrives, `active` is foreground with interaction unknown. That is an honest answer, not a failure.

## Startup

The adapter subscribes before it reads `AppState.currentState`, so a change during the read wins over the stale baseline. An unresolved state is unknown, with the listeners attached; there is no polling and no timeout.

## Expo and web builds

Expo on iOS and Android uses this adapter; there is no Expo-specific one. For a web build of the same application, choose the adapter with platform files instead of a runtime check:

```ts
// lifecycle.native.ts
export const pulse = new Pulse({
  adapter: reactNative({ appState: AppState, platform: Platform.OS }),
});
```

```ts
// lifecycle.web.ts
export const pulse = new Pulse({ adapter: browser() });
```

A headless task runs JavaScript without the UI: do not start the UI's Pulse from it, and do not treat the task's execution as foreground.

## Limits

Phase follows AppState, not pixels: a paused activity that is still visible, in split screen or behind a credential picker, can be background. The adapter removes only its own subscriptions, never calls `removeAllListeners`, and cannot make importing React Native inert. A privacy screen that must cover content before the system snapshot needs native code; a JavaScript event arrives too late.
