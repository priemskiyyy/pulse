---
description: "Create one Pulse per host, subscribe passively, start it once at bootstrap and dispose it only at an explicit teardown."
---

# Getting started

```sh
pnpm add @priemskiyyy/pulse
```

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";

// Module scope, client side: one instance for the page.
export const pulse = new Pulse({ adapter: browser() });

const stopState = pulse.state.subscribe(() => {
  const { phase, interaction } = pulse.state.get();
});

const stopForeground = pulse.on("foreground", (event) => {
  console.log("Entered foreground after", event.observedAway, "ms");
});

// At bootstrap, once.
pulse.start();
```

## Ownership

- **Constructing observes nothing.** The adapter is not called, the clock is not read, the host is not touched.
- **Subscribing creates no demand.** `state.subscribe` and `on` never start the observation, never call back at once, and never replay a past event.
- **`start()` begins, once.** A repeat is a no-op. When the adapter's `available()` answers false, such as the browser adapter on a server, it observes nothing and the state stays unknown. When the adapter's `available()` or setup throws, `start()` throws a `PulseError` with the code `START_FAILED`, and that instance is finished: create a new one to retry.
- **`dispose()` ends it for good.** Queued input is dropped, no callback runs afterwards, and the last snapshot stays readable. There is no restart.

Dispose only at an explicit host teardown, never on background, `pagehide`, blur or a component unmount. Remove the integrations that read the Pulse first, then dispose it: disposal announces nothing.

## Async work is yours

```ts
pulse.on("foreground", () => {
  service.revalidateIfStale().catch(reportError);
});
```

Pulse neither awaits nor catches a promise a listener returns. It does not guarantee that the work finishes, and a background event is no time to save state you cannot lose: persist as the application changes.

## Errors and diagnostics

Every reported error goes to `onError(error, context)`, or to `console.error` without one. `context` says where the error came from, the adapter and the commit sequence. `onDiagnostic` receives `started`, `unavailable`, `commit` and `duplicate` records, synchronously and only when you pass it; Pulse keeps no history.
