# Lifecycle lab, a Pulse example

The lifecycle lab is one page that observes itself through [Pulse](../../README.md)'s browser adapter and shows, side by side, what Pulse committed and what the browser raised. Nothing leaves your browser.

```sh
pnpm install
pnpm build
pnpm --filter example-react dev
```

The packages are linked from the workspace, so build them first. Open `/?record` to record raw signals from the first load, and `/?staleAfter=0` to refresh on every return.

## The tour

The page walks through four sections, each with a "Try this" hint:

1. **Two fields, never a guess.** The phase and the interaction as `useLifecycle` reads them, the document token and whether the page's Pulse still observes. Dispose is final.
2. **Refresh stale data on return.** A foreground transition refreshes data older than 30 seconds, one request at a time, and a failure shows while the old data stays.
3. **Watch it happen.** Pulse's diagnostics and transitions, the refreshes and, while recording, the raw browser events. Export trace downloads them with the browser's details.
4. **Simulate what the browser will not do.** A second Pulse over the mock adapter from `@priemskiyyy/pulse/testing`, labeled as a simulation.

## Manual exercises

Playwright keeps pages visible and focused and does not support the back/forward cache, so these stay manual. Export the trace after each one and record the browser, its version and the operating system.

1. Switch to another tab and back: background, then foreground and one refresh.
2. Focus another window while the page stays visible: interaction unavailable, phase foreground.
3. Minimize and restore the window.
4. Open the second page and go back. `pageshow persisted=true` with the same token is a back/forward cache restore; a new token is a fresh load.
5. In Chrome, freeze the tab from `chrome://discards`, then return to it.

## How it fits together

| File                                          | Role                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/main.tsx`                                | Creates the lab once, outside React, records the document's signals and starts Pulse. |
| `../shared/lab/createLifecycleLab.ts`         | The one Pulse, the refresh on return, the simulation and the timeline.                |
| `../shared/formatting/formatTimelineEntry.ts` | Every timeline entry in words, matched exhaustively.                                  |
| `src/utils/recordDocumentSignals.ts`          | The raw browser events, recorded by the example, not by Pulse.                        |
| `src/components/`                             | One folder per panel; the styles are the shared `cva` recipes.                        |
