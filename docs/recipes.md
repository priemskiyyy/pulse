---
description: "Application recipes for foreground eligibility and TanStack Query focus, each with an explicit unknown policy and its own cleanup."
---

# Recipes

These are application code, not Pulse exports. Each one is compiled and tested in [`examples/shared/recipes`](https://github.com/priemskiyyy/pulse/tree/main/examples/shared/recipes), and each states its own policy for unknown.

## Foreground eligibility

A service that must also act on the first known state, or that attaches late, reads the current state instead of waiting for an event:

<!-- snippet: fragment -->

```ts
const stop = observeForegroundEligibility(pulse, (eligible) => {
  poller.setEnabled(eligible);
});
```

Foreground is eligible; background and unknown are not. The callback runs at once with the current state, then only when eligibility changes. If that first call throws, the recipe removes its own subscription.

## TanStack Query focus

<!-- snippet: fragment -->

```ts
import { focusManager } from "@tanstack/query-core";

installPulseQueryFocus(pulse, focusManager);
pulse.start();
```

Query's focus follows the phase: foreground is focused, background and unknown are not, so a browser focus-only change, iOS `inactive` and the Android notification drawer leave Query focused. Requiring `interaction === "available"` instead is a stricter policy, which holds Android work while its focus is unknown.

Install it once, at bootstrap: the focus manager is a singleton that replaces its setup, and nothing restores the one before. Do not also refetch on every foreground event; Query already refetches stale queries when it regains focus. Connectivity belongs to `onlineManager`, never to the phase.

## Other services

Every integration owns its policy: what unknown means, how it deduplicates and cancels work, and which user a late result belongs to. Background is not a logout, unknown is not offline, and a `null` away time never means zero.
