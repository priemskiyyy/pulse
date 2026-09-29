# Pulse

**Application lifecycle state for TypeScript, React and React Native.**

[![npm beta](https://img.shields.io/npm/v/%40priemskiyyy%2Fpulse/next?label=npm%20beta&color=be123c)](https://www.npmjs.com/package/@priemskiyyy/pulse)
[![Tests](https://github.com/priemskiyyy/pulse/actions/workflows/packages.test.yml/badge.svg)](https://github.com/priemskiyyy/pulse/actions/workflows/packages.test.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-475569)](LICENSE)

[Documentation](https://priemskiyyy.github.io/pulse/) · [Try the lifecycle lab](https://priemskiyyy.github.io/pulse/demo/) · [Changelog](CHANGELOG.md)

Give your application one shared view of whether it is in the foreground and
whether interaction is available. Pulse reports immutable snapshots and
deduplicated foreground/background transitions, with an estimate of how long
the app was away. The browser and React Native adapters share the same API.

No runtime dependencies. ESM. React is optional.

## Install

```sh
pnpm add @priemskiyyy/pulse@next
```

The first release is a public beta. See [status](#status) for the verification limits.

## Browser

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";

export const pulse = new Pulse({ adapter: browser() });

pulse.on("foreground", (event) => {
  console.log("Returned after", event.observedAway, "ms");
});

pulse.start();
```

## React Native

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { reactNative } from "@priemskiyyy/pulse/react-native";
import { AppState, Platform } from "react-native";

export const pulse = new Pulse({
  adapter: reactNative({ appState: AppState, platform: Platform.OS }),
});

pulse.start();
```

Create and start the instance at application bootstrap. In React, read it with
`useLifecycle(pulse)` from `@priemskiyyy/pulse/react`. Subscriptions are passive;
call `pulse.dispose()` only when the application explicitly tears down the host.

## Why not use AppState or visibilitychange directly

For one listener in one component, use them directly. Pulse is for the moment several services each attach their own listener and each decide differently what "active" means, what to do at startup, and what counts as a return:

- **Two fields, not a boolean.** A visible window without focus, an iOS `inactive` interruption and the Android notification drawer change interaction, never phase.
- **Unknown is a value.** Discovering the first state is not a transition, and nothing is inferred across an unknown gap, so startup never looks like a return.
- **Deduplicated, ordered edges.** `pagehide`, `visibilitychange`, `resume`, `pageshow` and `focus` around one restore are one foreground event, and events queued from a callback wait their turn instead of being skipped.
- **One owner.** Constructing observes nothing, hooks and services subscribe passively, and only the application starts and disposes.

## What Pulse is not

Not a background task runner, a scheduler, a guaranteed exit hook, a session or presence tracker, an analytics engagement timer, or a security signal. A foreground event is not permission to run, a background event does not mean JavaScript keeps running, and `observedAway` is an estimate, never a timeout you can trust for authorization.

## Documentation

- [The package readme](packages/pulse/README.md): installation, the API and the entry points.
- [Documentation](https://priemskiyyy.github.io/pulse/): states and transitions, the adapters, React, testing and verification. `pnpm dev:docs` serves it locally.
- [Live lifecycle lab](https://priemskiyyy.github.io/pulse/demo/): inspect this browser's signals alongside Pulse's state and transitions.
- [The browser lab](examples/react) and [the Expo lab](examples/expo): Pulse next to the raw host signals, for exercising a real browser or device.

## Status

`0.1.0-beta.1` is the first public beta, available under npm's `next` tag.
The automated checks cover the runtime, adapter mappings, React integration,
package installation, browser labs and native bundles. Physical iOS and Android
devices, real browser tab/focus changes, freeze/discard and back/forward-cache
restoration still need platform verification. See the
[verification matrix](https://priemskiyyy.github.io/pulse/verification) for the
evidence and the remaining exercises.

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm check:release
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SUPPORT.md](SUPPORT.md) and [RELEASING.md](RELEASING.md).

## License

[MIT](LICENSE)
