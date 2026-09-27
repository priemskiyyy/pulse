---
description: "Where the implementation departs from the Pulse specification, and why: the sibling libraries' conventions, and simplicity over defensive checks."
---

# Decisions

The specification is the design; these are the deliberate departures from it, each with its reason.

## Types before runtime checks

The specification validates options, arguments and adapter snapshots at runtime. Pulse trusts its strict types instead: there is no `INVALID_OPTIONS` code, and a malformed snapshot from untyped JavaScript is a programming error that may throw. Runtime checks remain only for what a type cannot say: background with an interaction other than unavailable (`INVALID_OBSERVATION`), a non-finite or backward clock (`INVALID_CLOCK`), a stale sample, and a closed observation. Compile-time contracts in `*.contracts.ts` pin the types.

## Adapters declare availability

Every adapter has `available(): boolean`, as Silo's do. When it is false, `start()` observes nothing, the state stays unknown and an `unavailable` diagnostic is emitted, instead of the adapter throwing a setup error. Starting on a server is therefore harmless, and React Native on the web is simply unavailable. A setup that throws still fails with `START_FAILED`.

## React Native is passed in

The specification imports `AppState` and `Platform` from React Native by default. Pulse never imports a platform at runtime, as none of its siblings does: `reactNative({ appState: AppState, platform: Platform.OS })`. React Native is therefore not a peer dependency. `AppState` statuses are typed exhaustively, and a contract file fails the build when React Native's own union changes.

## Sibling conventions

- `type` instead of `interface`, no `readonly` in types; published data is frozen at runtime instead.
- The readable is named `ObservableValue`, as in every sibling, instead of `Readable`.
- `PulseError` takes grouped options, `{ code, message, cause }`.
- Durations carry no unit suffix: `observedAway`, not `observedAwayMs`.
- Identifiers live in their object: `adapter: { name }` in error contexts and diagnostics.
- `Unsubscribe` is not exported; an unsubscriber is `() => void`.
- The build targets ES2022, as the siblings do, rather than ES2020.
- The seven valid snapshots are interned, which the specification allows: an unchanged state keeps its identity, and so does a state that returns.

## Simplicity

Registration rollback and aggregate cleanup errors for `addEventListener` and AppState subscriptions were removed: those calls do not fail on the hosts Pulse supports. Error reporting stays synchronous, with a guarded `console.error` fallback instead of the siblings' rethrow in a microtask, because Pulse schedules nothing.
