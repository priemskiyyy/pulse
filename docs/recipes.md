---
description: "Application recipes for foreground eligibility and TanStack Query focus, each with an explicit unknown policy and its own cleanup."
---

# Recipes

These are application code, not Pulse exports. Each one is compiled and tested in [`examples/recipes`](../examples/recipes/src), and each states its own policy for unknown.

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

Query's focus follows the phase: foreground is focused, background and unknown are not. A browser focus-only change, iOS `inactive` and the Android notification drawer leave Query focused, which differs from Query's own React Native example on purpose. A stricter policy, `interaction === "available"`, can hold Android work while its focus is unknown; it is a different choice, not a fix.

Install it once, at the application's bootstrap. The focus manager is a singleton that replaces its setup rather than stacking it, so nothing restores the listener that was there before, and `setFocused(undefined)` only resets an override. Do not also refetch on every foreground event: Query already refetches stale queries when it regains focus. Connectivity belongs to `onlineManager` and its own source, never to the phase.

## Other services

Every integration owns its policy: what unknown means, how it deduplicates work, how it cancels, and which identity a late result belongs to. A background event is not a logout or a denial, unknown is not offline, and a `null` away time never means zero. Capture the identity before an asynchronous check and discard the result if it changed.
