---
description: "PulseProvider publishes a Pulse and useLifecycle reads a lifecycle source in React, hydrates from unknown, and never starts or disposes the source."
---

# React

The React binding is its own package, `@priemskiyyy/pulse-react`, beside `@priemskiyyy/pulse`.

```tsx
import { useLifecycle } from "@priemskiyyy/pulse-react";

import { pulse } from "src/lifecycle";

export const LifecycleLabel = () => {
  const { phase, interaction } = useLifecycle(pulse);

  return (
    <span>
      {phase} / {interaction}
    </span>
  );
};
```

`useLifecycle(source)` subscribes with `useSyncExternalStore` and answers the current frozen snapshot. It accepts any object with a `state` readable, not only a `Pulse`. It supports React 18.3 and 19, works the same in React Native, and its module is marked `"use client"`.

## Provider

`PulseProvider` publishes one Pulse to the tree below, so components call `useLifecycle()` without importing the instance. `usePulse()` returns that Pulse, for `on()` subscriptions in effects. Without a provider, both throw `PulseError` with `INVALID_CONFIGURATION`; a source passed to `useLifecycle` always wins.

```tsx
import { PulseProvider, useLifecycle } from "@priemskiyyy/pulse-react";

const Phase = () => <span>{useLifecycle().phase}</span>;

export const App = () => (
  <PulseProvider pulse={pulse}>
    <Phase />
  </PulseProvider>
);
```

The provider only publishes: start the Pulse at bootstrap, never in an effect.

## It only observes

The hook never starts, disposes or configures the source, and replays no transition. Many hooks add many passive subscriptions and no platform listener. Unmounting every hook does not stop the observation, and a remount reads the current state. Components that need the state use the hook; services that need transitions subscribe with `on()` at bootstrap.

Never start and dispose a shared instance in an effect: Strict Mode runs the cleanup once in development, and a disposed Pulse cannot start again.

<!-- snippet: fragment -->

```tsx
// Do not do this.
useEffect(() => {
  pulse.start();

  return () => pulse.dispose();
}, []);
```

## Server rendering and hydration

The server snapshot is always unknown on both axes, the same frozen object on every call. On the server, render with a Pulse you never start, or with any source whose `get` answers `UNKNOWN_LIFECYCLE_STATE`; never fake foreground. On the client, a Pulse that already knows its state still hydrates from unknown, then re-renders with the live state, so markup never mismatches.

## Teardown

Unmount the React tree and remove every integration before disposing the Pulse: subscribing to a disposed Pulse throws `DISPOSED`, so a component that mounts afterwards fails instead of reading a stale snapshot. For an embedded root or a micro-frontend, the mount function creates, starts and returns a teardown for its own instance; a later mount creates a new one.
