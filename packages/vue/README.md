# @priemskiyyy/pulse-vue

Vue bindings for [Pulse](../pulse): a provider that publishes one Pulse, and composables that read it. They observe only: they never start, dispose or configure the Pulse.

## Installation

```sh
pnpm add @priemskiyyy/pulse@next @priemskiyyy/pulse-vue@next
```

Requires Vue 3.5 or later.

## Read the lifecycle

```ts
import { useLifecycle, usePulse } from "@priemskiyyy/pulse-vue";
import { computed, onScopeDispose } from "vue";

export const useRefreshOnForeground = (refresh: () => void) => {
  const state = useLifecycle();

  onScopeDispose(usePulse().value.on("foreground", refresh));

  return computed(() => state.value.phase);
};
```

- `PulseProvider` publishes one Pulse to the components below and follows a new `pulse` prop. Start the Pulse at bootstrap; the provider never starts or disposes it.
- `useLifecycle(source?)` returns a read-only computed ref of the frozen `{ phase, interaction }` snapshot of the given source or the provider's Pulse. It reads unknown on the server and until mounted.
- `usePulse()` returns a computed ref of the provider's Pulse.

Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`.

## License

MIT
