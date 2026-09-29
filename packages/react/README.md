# @priemskiyyy/pulse-react

React bindings for [Pulse](../pulse): a provider that publishes one Pulse, and hooks that read it. They observe only: they never start, dispose or configure the Pulse.

## Installation

```sh
pnpm add @priemskiyyy/pulse@next @priemskiyyy/pulse-react@next
```

Requires React 18.3 or later.

## Read the lifecycle

```tsx
import { PulseProvider, useLifecycle } from "@priemskiyyy/pulse-react";

const LifecycleLabel = () => {
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

- `PulseProvider` publishes one Pulse to the tree below. Start the Pulse at bootstrap; the provider never starts or disposes it.
- `useLifecycle(source?)` reads the frozen `{ phase, interaction }` snapshot of the given source or the provider's Pulse. It reads unknown on the server and while hydrating.
- `usePulse()` returns the provider's Pulse, for `on()` subscriptions in effects.

Without a provider, `usePulse()` and a sourceless `useLifecycle()` throw `PulseError` with `INVALID_CONFIGURATION`. The module is marked `"use client"`.

## License

MIT
