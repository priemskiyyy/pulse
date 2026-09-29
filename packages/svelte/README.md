# @priemskiyyy/pulse-svelte

Svelte bindings for [Pulse](../pulse): a provider that publishes one Pulse, and utilities that read it through `current`. They observe only: they never start, dispose or configure the Pulse.

## Installation

```sh
pnpm add @priemskiyyy/pulse@next @priemskiyyy/pulse-svelte@next
```

Requires Svelte 5.7 or later. The package ships its sources for your Svelte compiler.

## Read the lifecycle

<!-- snippet: fragment -->

```svelte
<script lang="ts">
  import { useLifecycle } from "@priemskiyyy/pulse-svelte";

  const lifecycle = useLifecycle();
</script>

<span>{lifecycle.current.phase} / {lifecycle.current.interaction}</span>
```

- `PulseProvider` publishes one Pulse to the components below and follows a new `pulse` prop: `<PulseProvider {pulse}><Application /></PulseProvider>`. Start the Pulse at bootstrap; the provider never starts or disposes it.
- `useLifecycle(source?)` reads the frozen `{ phase, interaction }` snapshot of the given source or the provider's Pulse through `current`. It reads unknown on the server and until mounted.
- `usePulse()` returns the provider's Pulse through `current`.

Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`.

## License

MIT
