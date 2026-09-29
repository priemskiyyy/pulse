# @priemskiyyy/pulse-solid

Solid bindings for [Pulse](../pulse): a provider that publishes one Pulse, and primitives that read it. They observe only: they never start, dispose or configure the Pulse.

## Installation

```sh
pnpm add @priemskiyyy/pulse@next @priemskiyyy/pulse-solid@next
```

Requires `solid-js` 1.9 or later.

## Read the lifecycle

```ts
import { useLifecycle, usePulse } from "@priemskiyyy/pulse-solid";
import { onCleanup } from "solid-js";

export const useRefreshOnForeground = (refresh: () => void) => {
  const state = useLifecycle();

  onCleanup(usePulse()().on("foreground", refresh));

  return () => state().phase;
};
```

- `PulseProvider` publishes one Pulse to the tree below and follows a new `pulse` prop. Start the Pulse at bootstrap; the provider never starts or disposes it.
- `useLifecycle(source?)` returns an accessor of the frozen `{ phase, interaction }` snapshot of the given source or the provider's Pulse. It reads unknown on the server and until mounted.
- `usePulse()` returns an accessor of the provider's Pulse.

Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`.

## License

MIT
