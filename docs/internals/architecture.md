---
description: "How a Pulse turns adapter observations into commits and transitions: ownership states, intake, the reducer, delivery order and the invariants each test guards."
---

# Architecture

```text
adapter.observe ─► intake (copy, validate, sample clock) ─► FIFO queue
                                                           │
            ┌──────────────────────────────────────────────┘
            ▼
reduceObservation ─► commit snapshot ─► state listeners ─► transition listeners
                                         ─► reported errors ─► commit diagnostic
```

## Ownership

```text
CREATED ─► STARTING ─► RUNNING ─► DISPOSED
               └──► FAILED ──────► DISPOSED
CREATED, STARTING ───────────────► DISPOSED
```

`Pulse` holds its ownership as a discriminated union. Only `STARTING` and `RUNNING` carry the observation token and the host callbacks; an observer callback whose token is not the current one is ignored, so a failed or disposed observation can never publish. `start()` calls `available()` first; when it is false the instance runs with no observation. During setup, observations are only queued: nothing is delivered before the adapter's cleanup is owned. A dispose during setup runs that cleanup once, as soon as setup returns.

## Intake and the reducer

`#accept` reads the snapshot once into its interned state (`readObservation`) and samples the clock once (`sampleClock`), then queues the record. `reduceObservation` is pure: the previous timeline and one observation in, the next timeline, an optional commit, an optional frozen event and whether the clock rolled back out. The clock is checked before duplicates, because a duplicate can reveal a discontinuity.

## Delivery

The queue drains while running and not already draining, so an observation made from any callback waits behind the current commit. Both listener groups are copied before the first callback; a registration removed before its turn is skipped; disposal clears the registries, which silences the rest of the commit, and empties the queue.

## Invariants and their tests

| Invariant                                              | Guarded in                                     |
| ------------------------------------------------------ | ---------------------------------------------- |
| Construction and subscription observe nothing          | `Pulse.test.ts` C-001, C-005                   |
| Setup cannot publish before its cleanup is owned       | `Pulse.test.ts` C-009, C-010, C-013            |
| Equal state keeps identity and sequence                | `transitions.test.ts` C-029, reducer pairs     |
| Only adjacent known phase changes are transitions      | `reduceObservation.test.ts`, `oracle.test.ts`  |
| An unknown phase breaks edges and timing               | C-032, C-033, C-034, the oracle                |
| Reentrant input waits behind the current commit        | `delivery.test.ts` C-058, C-063, C-064         |
| Listener membership is fixed before the first callback | C-059, C-060, C-061                            |
| Timing is sampled at intake; anomalies void the pair   | C-050 to C-057                                 |
| Disposal stops every later callback                    | C-068, C-070, the disposal property            |
| No entry reaches another platform                      | `verify-lint-rules.mjs`, `verify-packages.mjs` |
