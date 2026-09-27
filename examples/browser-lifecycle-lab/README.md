# Browser lifecycle lab

A page that shows what Pulse commits next to the raw browser signals, so a person can compare them on a real browser.

```sh
pnpm build
pnpm --filter example-browser-lifecycle-lab dev
```

Open `/?record` to record raw signals from the first load. `?staleAfter=0` makes every foreground transition refresh.

## Panels

- **State**: the current `phase` and `interaction`; unknown is styled as unknown.
- **Instance**: a token made per document execution, and whether the lab disposed its Pulse.
- **Stale-data refresh**: a foreground transition refreshes data older than 30 seconds, one request at a time, and shows the last failure.
- **Commits**: each committed state from `onDiagnostic`.
- **Raw signals**: `visibilitychange`, `focus`, `blur`, `pagehide`, `pageshow`, `freeze` and `resume`, recorded by the lab, not by Pulse. **Export trace** downloads both lists as JSON.
- **Simulation**: a separate Pulse over a mock adapter. Nothing in it comes from the browser.

## Manual exercises

1. Switch to another tab and back: background, then foreground and one refresh.
2. Focus another window while the page stays visible: interaction becomes unavailable, the phase stays foreground.
3. Minimize and restore the window.
4. Open the second page and go back. A back/forward cache restore shows `pageshow persisted=true` and keeps the token; a fresh load shows a new token.
5. In Chrome, freeze the tab from `chrome://discards`, then return to it.

Export the trace after each exercise and record the browser, its version and the operating system next to it.

## Automated tests

`pnpm test:browser` runs the lab in real Chromium with Playwright: the first load, ordinary back navigation, disposal, the export and the simulation. Playwright keeps pages visible and focused and does not support the back/forward cache, so the exercises above stay manual.
