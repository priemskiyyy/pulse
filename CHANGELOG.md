# Changelog

## @priemskiyyy/pulse 0.1.0 - Unreleased

- First release. `Pulse` owns one observation of an application's lifecycle: a frozen `{ phase, interaction }` snapshot through `state.get()` and `state.subscribe()`, and deduplicated `foreground` and `background` transitions through `on()`.
- Unknown is a value. Initial discovery, interaction-only changes and changes across an unknown phase are never transitions.
- A foreground event carries `observedAway`, the milliseconds since an observed departure, or `null` when the pair was not fully observed or the clock failed or moved backwards.
- Observations are delivered in order: an observation made from a callback waits behind the current commit. Nothing is scheduled, polled or debounced.
- An adapter is a plain `{ name, available, observe }`. When `available()` is false, `start()` observes nothing and the state stays unknown.
- `browser()` observes a document's visibility and focus, holds background from `pagehide` to `pageshow`, and treats a prerendering document as background. A throwing getter leaves only its own field unknown and is reported after that state.
- `reactNative({ appState, platform })` maps iOS `active` and `inactive`, Android `active` with `focus` and `blur` evidence, and never imports React Native.
- Both adapters undo a setup that throws and try every removal on cleanup, even when one throws.
- `useLifecycle(source)` under `./react` reads the current snapshot and hydrates from unknown. It never starts or disposes anything.
- `createMockAdapter`, `createTestClock` and the runner-independent `testLifecycleAdapter` conformance suite under `./testing`.
- Requires React 18.3 or 19 for `./react`, and nothing else.
