# Pulse

**Trustworthy, reactive application-lifecycle observations for TypeScript.**

Pulse gives an application one owned observation of its lifecycle, on the web and in React Native: a `phase` (`foreground`, `background` or `unknown`) and an `interaction` (`available`, `unavailable` or `unknown`) as immutable snapshots, and deduplicated `foreground` and `background` transitions with an estimate of how long the app was away. It reports what its platform observed. It does not decide what your application is allowed to run.

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";

export const pulse = new Pulse({ adapter: browser() });

pulse.on("foreground", (event) => {
  refreshIfStale(event.observedAway);
});

pulse.start();
```

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
- [Documentation](docs/index.md): states and transitions, the adapters, React, testing and verification.

## Status

Nothing is published yet. The package is `0.1.0` and its changelog entry is `Unreleased`. The adapters are verified against jsdom pages and a fake `AppState`; real browsers and devices are not yet exercised.

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm check:release
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SUPPORT.md](SUPPORT.md) and [RELEASING.md](RELEASING.md).

## License

[MIT](LICENSE)
