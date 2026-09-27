---
description: "What the automated tests prove about Pulse, what they cannot, and which platform exercises are still unverified."
---

# Verification

A green test run proves the core's rules and the adapters' mappings against fakes. It does not prove what a real browser or device delivers.

## Evidence tiers

| Tier                        | Status                 | What it establishes                                                                 |
| --------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| Core and model tests        | automated              | Snapshots, transitions, timing, ordering, reentrancy, ownership, error containment  |
| Generated traces            | automated, fixed seeds | The runtime agrees with an independent oracle; metamorphic properties hold          |
| Mutation tests              | automated              | Every silent rule is defended by a test that goes red when it is weakened           |
| Browser adapter on jsdom    | automated              | Mapping, listener registration and cleanup, the pagehide latch, sampling races      |
| Native adapter on a fake    | automated              | iOS and Android mapping, Android focus evidence, baseline races, cleanup            |
| React on jsdom and a server | automated              | Passive subscriptions, Strict Mode, source replacement, server render, hydration    |
| Packed tarball consumer     | automated              | Exports, declarations without DOM or Node types, platform isolation, Node smoke run |
| Real back/forward cache     | not yet verified       | Persisted restoration with the same document and live listeners                     |
| Real freeze and discard     | not yet verified       | Engine behavior of `freeze`, `resume` and discarding                                |
| Physical iOS and Android    | not yet verified       | AppState and focus order on real devices, interruptions, multi-window               |

An unverified tier is unverified, never a passing mock test. Playwright documents that it does not support back/forward cache testing, so a `page.goBack()` test is not restoration evidence: that exercise needs a browser where `pageshow.persisted` is true and the original document survives.

## Scenario catalog

The specification names 200 scenarios. The tests carry their IDs:

- `C-001` to `C-072`, the core: `src/utils/*.test.ts` and `src/utils/internal/**`.
- `B-001` to `B-046`, the browser adapter: `src/adapters/browser/**`. `B-047`, a real back/forward cache restore, is a host exercise.
- `N-001` to `N-030`, the native adapter: `src/adapters/react-native/**`. `N-031`, device multi-window and credential picker traces, is a host exercise.
- `R-001` to `R-018`, React: `src/react/**`.
- `I-001` to `I-017`, integrations: `examples/recipes/src/**`, with the Reach, Shift, Simulcast, Anchor and Chime policies documented in [recipes](recipes.md) rather than built.
- `P-001` to `P-015`, packaging: `scripts/verify-packages.mjs`, `scripts/measure-size.mjs` and `scripts/verify-release.mjs`.

Scenarios about removed runtime checks, such as malformed snapshots or throwing getters, are covered by the types and the `*.contracts.ts` files instead; see [decisions](decisions.md).

## Reporting a platform exercise

Record the package revision, the exact browser or device and runtime versions, the build and launch configuration, the scenario IDs exercised, the raw signals next to the Pulse commits, the result, and any discrepancy. Label simulator evidence as simulator evidence.
