---
description: "setPulseContext publishes a Pulse to a Svelte tree and useLifecycle reads it through current, unknown until mounted, never starting or disposing it."
---

# Svelte

```ts
import { useLifecycle, usePulse } from "@priemskiyyy/pulse/svelte";
import { onMount } from "svelte";

export const useRefreshOnForeground = (refresh: () => void) => {
  const lifecycle = useLifecycle();
  const pulse = usePulse();

  onMount(() => pulse.on("foreground", refresh));

  return lifecycle;
};
```

`@priemskiyyy/pulse/svelte` publishes with `setPulseContext(pulse)`, called while the root component initializes, in place of a provider component. `useLifecycle(source?)` returns an object whose `current` is the frozen snapshot, reactive in templates and runes, and `usePulse()` returns the Pulse. It supports Svelte 5 and ships no `.svelte` files, so it needs no Svelte build step.

<!-- snippet: fragment -->

```svelte
<script>
  import { setPulseContext, useLifecycle } from "@priemskiyyy/pulse/svelte";

  setPulseContext(pulse);

  const lifecycle = useLifecycle();
</script>

<span>{lifecycle.current.phase}</span>
```

## It only observes

`setPulseContext` only publishes, once, like any Svelte context. Neither it nor `useLifecycle` or `usePulse` start, dispose or configure the Pulse: start it at bootstrap. Without a context, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`; a source passed to `useLifecycle` always wins.

## Server rendering and hydration

`useLifecycle` reads `UNKNOWN_LIFECYCLE_STATE` on the server and until the component is mounted, so the server and the hydrating client render the same markup, then `current` follows the live state. Unmounting removes only its subscription.
