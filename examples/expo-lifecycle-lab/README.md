# Expo lifecycle lab

The same normalized state as the browser lab, next to a local trace of the raw host signals, on iOS, Android and the web.

```sh
pnpm build
pnpm --filter example-expo-lifecycle-lab dev
```

The platform files choose the adapter, never a runtime check: `src/lifecycle.native.ts` observes `AppState` through `@priemskiyyy/pulse/react-native`, and `src/lifecycle.web.ts` observes the document through `@priemskiyyy/pulse/browser`.

## Checks on a device

1. Open Notification Center or Control Center on iOS: `inactive` keeps the phase foreground with interaction unavailable.
2. Open the notification drawer on Android: a `blur` makes interaction unavailable while the app stays active.
3. Switch to another app and back: background, then foreground.
4. Lock and unlock the device.
5. Quit and relaunch: a fresh start begins at unknown, with no transition from the last run.

Record the runtime line, the device, the build mode (development or release) and the trace for each check.

## Automated tests

`pnpm test:browser` runs the web export in Chromium. `pnpm --filter example-expo-lifecycle-lab build:native` bundles both native platforms with Metro, which proves the exports resolve; the checks above still need a device.
