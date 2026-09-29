---
description: "PulseProvider publishes a Pulse to a Solid tree and useLifecycle reads it as an accessor, unknown until mounted, never starting or disposing it."
---

# Solid

```ts
import { useLifecycle, usePulse } from "@priemskiyyy/pulse-solid";
import { onCleanup } from "solid-js";

export const useRefreshOnForeground = (refresh: () => void) => {
  const state = useLifecycle();

  onCleanup(usePulse()().on("foreground", refresh));

  return () => state().phase;
};
```

`@priemskiyyy/pulse-solid`, installed beside `@priemskiyyy/pulse`, has the same three names as `@priemskiyyy/pulse-react`, with Solid shapes: `useLifecycle(source?)` returns an accessor of the frozen snapshot, and `usePulse()` returns an accessor of the provider's Pulse. It supports `solid-js` 1.9.

<!-- snippet: fragment -->

```tsx
<PulseProvider pulse={pulse}>
  <Application />
</PulseProvider>
```

## It only observes

`PulseProvider` only publishes, and follows a new `pulse` prop. Neither it nor the primitives start, dispose or configure the Pulse: start it at bootstrap. Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`; a source passed to `useLifecycle` always wins.

## Server rendering and hydration

`useLifecycle` reads `UNKNOWN_LIFECYCLE_STATE` on the server and until the component is mounted, so hydration claims the server markup as it is, then the accessor follows the live state. Disposing the owner removes only its subscription.
