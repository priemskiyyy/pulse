# @priemskiyyy/pulse

Application lifecycle observation for TypeScript, on the web and in React Native. One Pulse owns one observation of its host and reports two things: a `phase` (`foreground`, `background` or `unknown`) and an `interaction` (`available`, `unavailable` or `unknown`), as immutable snapshots, plus deduplicated `foreground` and `background` transitions. It reports what its platform observed; it never decides what your application may run.

No dependencies, ESM only, no side effects on import.

[Documentation](https://priemskiyyy.github.io/pulse/) · [Live lifecycle lab](https://priemskiyyy.github.io/pulse/demo/) · [GitHub](https://github.com/priemskiyyy/pulse)

## Installation

```sh
pnpm add @priemskiyyy/pulse@next
```

This is the `0.1.0-beta.1` public beta. Physical-device behavior and several real
browser lifecycle scenarios remain unverified. Read the
[verification matrix](https://priemskiyyy.github.io/pulse/verification) before
choosing the platforms your application relies on.

## Use it

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";

export const pulse = new Pulse({ adapter: browser() });

pulse.on("foreground", (event) => {
  console.log("Back after", event.observedAway, "ms");
});

pulse.start();
```

On React Native, pass the modules in; Pulse never imports React Native:

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { reactNative } from "@priemskiyyy/pulse/react-native";
import { AppState, Platform } from "react-native";

export const pulse = new Pulse({
  adapter: reactNative({ appState: AppState, platform: Platform.OS }),
});

pulse.start();
```

In React, publish the Pulse once and read the current state; neither the
provider nor the hook starts or disposes anything:

```tsx
import { PulseProvider, useLifecycle } from "@priemskiyyy/pulse/react";

export const LifecycleLabel = () => {
  const { phase, interaction } = useLifecycle();

  return (
    <span>
      {phase} / {interaction}
    </span>
  );
};

export const App = () => (
  <PulseProvider pulse={pulse}>
    <LifecycleLabel />
  </PulseProvider>
);
```

Creating a Pulse observes nothing. `start()` begins, once; when the adapter is unavailable, such as the browser adapter on a server, it observes nothing and the state stays unknown. `dispose()` ends it for good.

## Phase and interaction

| Host                               | `phase`      | `interaction`                               |
| ---------------------------------- | ------------ | ------------------------------------------- |
| Visible page                       | `foreground` | `available` or `unavailable` from focus     |
| Hidden, `pagehide` or prerendering | `background` | `unavailable`                               |
| iOS `active` / `inactive`          | `foreground` | `available` / `unavailable`                 |
| Android `active`                   | `foreground` | `unknown` until a `focus` or `blur` arrives |
| `background` on either platform    | `background` | `unavailable`                               |
| `unknown`, `extension`, unresolved | `unknown`    | `unknown`                                   |

Only an observed, adjacent change between known phases is a transition. Discovering the first state, an interaction-only change, or a change across `unknown` is none.

## The Pulse

| Member               | What it does                                                                          |
| -------------------- | ------------------------------------------------------------------------------------- |
| `state`              | `get()` and `subscribe(listener)`: the frozen snapshot, stable until the next commit. |
| `on(type, listener)` | Listens to `foreground` or `background`. Events never replay.                         |
| `start()`            | Begins the observation once. A probe or setup that throws becomes `START_FAILED`.     |
| `dispose()`          | Ends it for good; the last snapshot stays readable.                                   |

## Options

| Option         | Default    | Meaning                                                                      |
| -------------- | ---------- | ---------------------------------------------------------------------------- |
| `adapter`      | required   | `browser()`, `reactNative(...)`, or your own `{ name, available, observe }`. |
| `now`          | `Date.now` | Epoch milliseconds, sampled once per observation.                            |
| `onError`      | console    | Receives every reported error with its context.                              |
| `onDiagnostic` | none       | Receives `started`, `unavailable`, `commit` and `duplicate` records.         |

## Entry points

| Entry            | Exports                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `.`              | `Pulse`, `PulseError`, `UNKNOWN_LIFECYCLE_STATE` and the types          |
| `./browser`      | `browser({ target? })`                                                  |
| `./react-native` | `reactNative({ appState, platform })`                                   |
| `./react`        | `PulseProvider`, `usePulse()`, `useLifecycle(source?)`, a client module |
| `./testing`      | `createMockAdapter`, `createTestClock`, `testLifecycleAdapter`          |

## Tests

`@priemskiyyy/pulse/testing` needs no test runner. `testLifecycleAdapter(createHarness)` runs the adapter conformance checks and throws one error naming every failed check.

## License

[MIT](LICENSE)
