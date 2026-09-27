---
description: "Where the implementation departs from the Pulse specification, and which adapters were considered and left out."
---

# Decisions

## Types before runtime checks

Options, arguments and snapshot shapes are checked by the types and the `*.contracts.ts` files, not at runtime: there is no `INVALID_OPTIONS` code, and untyped JavaScript that breaks the types may throw. Runtime checks remain only for what a type cannot say: background with an interaction other than unavailable, a non-finite or backward clock, a stale sample and a closed observation.

## Availability instead of setup errors

An adapter declares `available()`. An unavailable host observes nothing and stays unknown, with an `unavailable` diagnostic, where the specification had the adapter throw during setup.

## Naming and shapes

`ObservableValue` instead of `Readable`, `observedAway` instead of `observedAwayMs`, `adapter: { name }` instead of `adapter: string`, `PulseError({ code, message, cause })` instead of positional arguments, `type` instead of `interface`, and no `readonly` in types: published data is frozen at runtime. `Unsubscribe` is not exported. The build targets ES2022. The seven valid snapshots are interned.

## Adapters left out

- **Expo**: on iOS and Android it is React Native's `AppState`; use `reactNative()`.
- **React Native Web and Expo web**: use `browser()`; React Native Web's `AppState` answers `active` when it does not know.
- **Capacitor**: `@capacitor/app` registers listeners and reads its state asynchronously, which a synchronous cleanup cannot honor, and its `isActive` tracks activation rather than background. Its WebView document is likely observable with `browser()`; revisit with device traces that show otherwise.
- **Electron main process and Tauri windows**: they describe desktop windows, not an application lifecycle. An Electron renderer can use `browser()`.
