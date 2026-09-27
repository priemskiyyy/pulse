---
description: "The browser adapter maps document visibility and focus to phase and interaction, holds background from pagehide to pageshow, and handles restores and prerendering."
---

# Browser

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";

export const pulse = new Pulse({ adapter: browser() });
```

`browser()` observes the global `window`'s document, or `browser({ target })` another window's own document. Creating it reads nothing. It is unavailable when there is no window, such as during a server render, or when the target is a detached frame; `start()` then observes nothing and the state stays unknown.

## Mapping

| Document                                  | `phase`                | `interaction`               |
| ----------------------------------------- | ---------------------- | --------------------------- |
| visible, `hasFocus()` true / false        | `foreground`           | `available` / `unavailable` |
| hidden, pagehide-latched, or prerendering | `background`           | `unavailable`               |
| any other `visibilityState`               | `unknown`              | from `hasFocus()`           |
| a getter that throws                      | that axis is `unknown` | reported after the state    |

Visibility and focus answer different questions. A visible window that loses focus to another window stays foreground with interaction unavailable, and that is no transition.

## Listeners

The adapter registers capture-phase listeners for `visibilitychange`, `freeze`, `resume` and `prerenderingchange` on the document, and `focus`, `blur`, `pagehide` and `pageshow` on the window. `pagehide` and `pageshow` set and clear a hold, below; every other event only resamples the document. Focus moving between controls, or into an iframe, never changes interaction: only the window's own focus events resample. It registers no `unload`, `beforeunload`, activity, router or timer listener, and never sets an `on*` handler property. Cleanup removes exactly its own listeners, all of them even when one removal throws, and a setup that throws removes the ones it had added.

## pagehide and pageshow

Every `pagehide`, persisted or not, holds the phase at background until the next `pageshow`. While held, `resume`, `focus` and `visibilitychange` cannot declare foreground early. `pageshow` releases it and resamples the actual visibility, so a page restored hidden stays background until it is visible.

A `pagehide` never disposes the Pulse: the same document can come back from the back/forward cache with its listeners intact. A restore that follows an observed departure is at most one foreground event, however many signals announce it. When every departure signal was missed, a restore invents nothing; a service that must react to a restore itself can read `pageshow.persisted` directly.

## Freeze, discard and prerendering

`freeze` and `resume` only resample: Pulse claims no execution state. A discarded or reloaded document starts a new Pulse with no history. A positively prerendering document is background; its activation can enter foreground from that baseline, with no away time.

## Limits

The adapter reports what the browser reports. Occlusion, the operating system, developer tools and embedding change that. Page visibility says nothing about CSS visibility inside the page. There is no worker, service worker, cross-tab or parent-frame observation. The browser can terminate a page without any final event.
