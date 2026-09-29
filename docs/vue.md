---
description: "PulseProvider publishes a Pulse to a Vue tree and useLifecycle reads it as a computed ref, unknown until mounted, never starting or disposing it."
---

# Vue

```ts
import { useLifecycle, usePulse } from "@priemskiyyy/pulse-vue";
import { computed, onScopeDispose } from "vue";

export const useRefreshOnForeground = (refresh: () => void) => {
  const state = useLifecycle();

  onScopeDispose(usePulse().value.on("foreground", refresh));

  return computed(() => state.value.phase);
};
```

`@priemskiyyy/pulse-vue`, installed beside `@priemskiyyy/pulse`, has the same three names as `@priemskiyyy/pulse-react`, with Vue shapes: `useLifecycle(source?)` returns a read-only computed ref of the frozen snapshot, and `usePulse()` returns a computed ref of the provider's Pulse. It supports Vue 3.5.

<!-- snippet: fragment -->

```vue
<PulseProvider :pulse="pulse">
  <Application />
</PulseProvider>
```

## It only observes

`PulseProvider` only publishes, and follows a new `pulse` prop. Neither it nor the composables start, dispose or configure the Pulse: start it at bootstrap. Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`; a source passed to `useLifecycle` always wins.

## Server rendering and hydration

`useLifecycle` reads `UNKNOWN_LIFECYCLE_STATE` on the server and until the component is mounted, so the server and the hydrating client render the same markup, then the ref follows the live state. Unmounting removes only its subscription.
