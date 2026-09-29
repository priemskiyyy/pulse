---
description: "PulseProvider publishes a Pulse to a Svelte tree and useLifecycle reads it through current, unknown until mounted, never starting or disposing it."
---

# Svelte

The Svelte binding is its own package, `@priemskiyyy/pulse-svelte`, beside `@priemskiyyy/pulse`. It ships its sources for the application's Svelte compiler.

<!-- snippet: fragment -->

```svelte
<script lang="ts">
  import { PulseProvider } from "@priemskiyyy/pulse-svelte";
  import Application from "./Application.svelte";
</script>

<PulseProvider {pulse}><Application /></PulseProvider>
```

<!-- snippet: fragment -->

```svelte
<script lang="ts">
  import { useLifecycle, usePulse } from "@priemskiyyy/pulse-svelte";

  const lifecycle = useLifecycle();
  const pulse = usePulse();

  $effect(() => pulse.current.on("foreground", refresh));
</script>

<span>{lifecycle.current.phase} / {lifecycle.current.interaction}</span>
```

`@priemskiyyy/pulse-svelte` has the same three names as `@priemskiyyy/pulse-react`, read through `current` the way Svelte's own reactive classes are: `useLifecycle(source?)` returns the frozen snapshot, and `usePulse()` the provider's Pulse. It supports Svelte 5.7 and later.

## It only observes

`PulseProvider` only publishes, and follows a new `pulse` prop. Neither it nor the utilities start, dispose or configure the Pulse: start it at bootstrap. Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`; a source passed to `useLifecycle` always wins.

## Server rendering and hydration

Effects never run on the server and run after mount on the client, so `useLifecycle` reads `UNKNOWN_LIFECYCLE_STATE` on the server and while hydrating, then `current` follows the live state. Unmounting removes only its subscription.
