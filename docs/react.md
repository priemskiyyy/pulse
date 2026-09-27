---
description: "useLifecycle reads a lifecycle source in React, hydrates from unknown, and never starts or disposes the source."
---

# React

```tsx
import { useLifecycle } from "@priemskiyyy/pulse/react";

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

## It only observes

The hook never starts, disposes or configures the source, and replays no transition. Many hooks add many passive subscriptions and no platform listener. Unmounting every hook does not stop the observation, and a remount reads the current state. Components that need the state use the hook; services that need transitions subscribe with `on()` at bootstrap.

Never start and dispose a shared instance in an effect: Strict Mode runs the cleanup once in development, and a disposed Pulse cannot start again.

```tsx
// Do not do this.
useEffect(() => {
  pulse.start();

  return () => pulse.dispose();
}, []);
```

## Server rendering and hydration

The server snapshot is always unknown on both axes, the same frozen object on every call. On the server, render with a Pulse you never start, one per request, or with any source whose `get` answers `UNKNOWN_LIFECYCLE_STATE`; never fake foreground. On the client, a Pulse that already knows its state still hydrates from unknown, then re-renders with the live state, so markup never mismatches.

## Teardown

Unmount the React tree and remove every integration before disposing the Pulse. For an embedded root or a micro-frontend, the mount function creates, starts and returns a teardown for its own instance; a later mount creates a new one.
