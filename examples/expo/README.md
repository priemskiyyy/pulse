# Lifecycle lab on Expo, a Pulse example

The same lab on iOS, Android and the web: the normalized state, a stale-data refresh, the device checks and a timeline of Pulse next to the raw host signals.

```sh
pnpm install
pnpm build
pnpm --filter example-expo dev
```

The platform files choose the adapter, never a runtime check: `src/lab/startLab.native.ts` observes `AppState` through `@priemskiyyy/pulse/react-native`, and `src/lab/startLab.web.ts` observes the document through `@priemskiyyy/pulse/browser`.

## Checks on a device

1. Open Notification Center or Control Center on iOS: `inactive` keeps the phase foreground with interaction unavailable.
2. Open the notification drawer on Android: a `blur` makes interaction unavailable while the app stays active.
3. Switch to another app and back: background, then foreground.
4. Lock and unlock the device.
5. Quit and relaunch: a fresh start begins at unknown, with no transition from the last run.

Record the runtime line, the device, the build mode (development or release) and the timeline for each check.

## Automated tests

`pnpm test:browser` runs the web export in Chromium. `pnpm --filter example-expo build:native` bundles both native platforms with Metro, which shows the exports resolve; the checks above still need a device.
