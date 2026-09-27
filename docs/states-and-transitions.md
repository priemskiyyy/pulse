---
description: "The seven valid lifecycle states, what counts as a foreground or background transition, and how the observed away time is estimated."
---

# States and transitions

```ts
const { phase, interaction } = pulse.state.get();

pulse.on("background", (event) => event.from.phase); // "foreground"
pulse.on("foreground", (event) => event.observedAway); // number or null
```

## Two fields

**Phase** is the adapter's lifecycle category: `foreground`, `background` or `unknown`. On the web it follows document visibility; in React Native it follows `AppState`. It is not literal pixel visibility.

**Interaction** is activation or input-focus evidence: `available`, `unavailable` or `unknown`. It is not attention, presence or a user gesture.

**Unknown** means there is no usable evidence, never `false`. Pulse never turns unknown into a known value because time passed. Choose your own policy for it, and render it as unknown rather than as background or offline.

Seven combinations are valid: three foreground, one background, three unknown. Background always carries `interaction: "unavailable"`; an adapter that reports background with any other interaction publishes unknown instead, and `onError` receives `INVALID_OBSERVATION`.

## Snapshots

`state.get()` answers the same frozen object until the next commit. A duplicate observation commits nothing: no notification, no new sequence, no new identity. Snapshots carry only the two fields.

## What counts as a transition

| Previous   | Next       | Commit                 | Event        |
| ---------- | ---------- | ---------------------- | ------------ |
| unknown    | foreground | yes                    | none         |
| unknown    | background | yes                    | none         |
| foreground | background | yes                    | `background` |
| background | foreground | yes                    | `foreground` |
| foreground | foreground | if interaction changed | none         |
| unknown    | unknown    | if interaction changed | none         |
| any known  | unknown    | yes                    | none         |

Discovering the first state is a baseline, not a transition, so startup never looks like a return. An unknown phase breaks continuity: `foreground`, `unknown`, `foreground` is no event, and neither is `background`, `unknown`, `foreground`. A foreground event can be the first entry after a background baseline, so it is not called a return.

Rapid changes are kept: `foreground`, `background`, `foreground` in one task is two events, in order. Each event is frozen, references the exact `from` and `to` snapshots, and carries the commit `sequence` of `to`; sequences skip the commits that were not transitions.

Events never replay. A service that attaches late reads `state.get()` instead; see [recipes](recipes.md).

## Delivery order

For each commit, the snapshot changes first, then every state listener runs, then every transition listener, then errors are reported, then the `commit` diagnostic. A listener registered during a commit starts with the next one. An observation made from inside a callback waits until the current commit's callbacks finish: every callback of a commit reads that commit. Listener errors are caught one by one and reported after the others ran.

## Observed away time

A foreground event's `observedAway` is the milliseconds between an observed departure and this entry, from the configured clock (`Date.now` by default), sampled when each observation arrived. It is an estimate, not a stopwatch: nothing ticks while the application is away.

It is `null` when:

- the background phase was a baseline, not an observed departure;
- an unknown phase came between;
- the clock threw, answered a non-finite number, or moved backwards since the departure (each such sample is reported as `INVALID_CLOCK`).

Zero is a valid duration, different from `null`. Large durations are not capped. A new instance, after a reload or a relaunch, carries nothing over. Never use the away time for authorization, a session timeout or billing.
