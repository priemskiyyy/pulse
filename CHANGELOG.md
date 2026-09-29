# Changelog

## @priemskiyyy/pulse 0.1.0 - 2026-09-29

First stable release. Physical-device behavior, real back/forward-cache
restoration and freeze/discard remain unverified; see the
[verification matrix](docs/verification.md).

- Breaking: `@priemskiyyy/pulse/react` moved to its own package, `@priemskiyyy/pulse-react`, like the bindings of the other Priemskiyyy libraries. The core has no framework peer.
- `PulseError` has the code `INVALID_CONFIGURATION`, which a binding throws when a hook reads no source.

## @priemskiyyy/pulse-react 0.1.0 - 2026-09-29

- First release. `PulseProvider` publishes one Pulse to a tree, `usePulse()` returns it, and `useLifecycle(source?)` reads the given source or the provider's Pulse, unknown on the server and while hydrating. The provider never starts or disposes the Pulse.
- Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`.
- Requires React 18.3 or 19.

## @priemskiyyy/pulse-solid 0.1.0 - 2026-09-29

- First release. `PulseProvider`, `usePulse()` and `useLifecycle(source?)` for Solid 1.9, as accessors, unknown until mounted.

## @priemskiyyy/pulse-vue 0.1.0 - 2026-09-29

- First release. `PulseProvider`, `usePulse()` and `useLifecycle(source?)` for Vue 3.5, as computed refs, unknown until mounted.

## @priemskiyyy/pulse-svelte 0.1.0 - 2026-09-29

- First release. `PulseProvider`, `usePulse()` and `useLifecycle(source?)` for Svelte 5.7, read through `current`, unknown until mounted. It ships its sources for the application's Svelte compiler.

## @priemskiyyy/pulse 0.1.0-beta.1 - 2026-09-29

Public beta. Install with `@priemskiyyy/pulse@next`. Physical-device behavior,
real back/forward-cache restoration and freeze/discard remain unverified; see
the [verification matrix](docs/verification.md).

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
