---
description: "Write a lifecycle adapter as a plain object: a cheap availability probe, a synchronous observe that reports full snapshots, and a cleanup that removes only its own subscriptions."
---

# Custom adapters

```ts
import type { LifecycleAdapter, LifecycleState } from "@priemskiyyy/pulse";

type Host = {
  isReady: () => boolean;
  read: () => LifecycleState;
  subscribe: (listener: (state: LifecycleState) => void) => () => void;
};

export const fromHost = (host: Host): LifecycleAdapter => ({
  name: "custom-host",
  available: () => host.isReady(),
  observe: (observer) => {
    let closed = false;
    let received = false;

    const remove = host.subscribe((state) => {
      if (closed) {
        return;
      }

      received = true;
      observer.next(state);
    });

    // Subscribe first: a change during the read wins over the baseline.
    if (!received) {
      observer.next(host.read());
    }

    return () => {
      if (closed) {
        return;
      }

      closed = true;
      remove();
    };
  },
});
```

## The contract

- **`available()`** is a cheap, synchronous probe of the host. When it answers false, `start()` never calls `observe` and the state stays unknown.
- **`observe(observer)`** registers synchronously and answers a synchronous cleanup. It may report a baseline at once, later, or never.
- **Full snapshots.** Every `observer.next` reports both fields. Duplicates are fine; the core drops them. Background always has interaction `unavailable`.
- **Order.** Report observations in the order the source delivered them, and never let a baseline read overwrite a newer event.
- **Errors only report.** `observer.error(error)` changes no state. When evidence becomes unusable, first report a snapshot with those fields unknown, then the error.
- **Cleanup** removes only this observation's own subscriptions, synchronously and idempotently, and silences its callbacks. Never call `removeAllListeners` on a borrowed source. Each `observe` call owns its own state: one adapter object can serve two Pulses.
- **Borrow the platform.** Take the SDK or module as an option; never import it at runtime.

The core rejects callbacks after cleanup on its own, but a conforming adapter is silent anyway.

## Conformance

```ts
import { testLifecycleAdapter } from "@priemskiyyy/pulse/testing";

const report = await testLifecycleAdapter(() => createHostHarness());
```

The harness supplies the adapter over a host that starts in foreground, moves it to `background()` and `foreground()`, flushes its own delivery with `settle()`, counts the subscriptions the adapter installed with `subscriptionCount()`, and cleans up with `disposeHost()`. The suite checks availability, a valid foreground baseline, the phase mapping, cleanup that removes everything, independent observations, idempotent cleanup and silence afterwards. It never requires every state combination, and passing it proves nothing about a real device; see [verification](verification.md).
