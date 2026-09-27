---
description: "Test code that uses Pulse with a scriptable mock adapter and a manual clock, and test an adapter with the runner-independent conformance suite."
---

# Testing

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { createMockAdapter, createTestClock } from "@priemskiyyy/pulse/testing";

const mock = createMockAdapter({
  initial: { phase: "foreground", interaction: "available" },
});
const clock = createTestClock(1_000);
const pulse = new Pulse({ adapter: mock.adapter, now: clock.now });
const away: Array<number | null> = [];

pulse.on("foreground", (event) => away.push(event.observedAway));
pulse.start();

clock.advance(1_000);
mock.emit({ phase: "background", interaction: "unavailable" });
clock.advance(4_500);
mock.emit({ phase: "foreground", interaction: "available" });

// away is [4_500]
pulse.dispose();
```

`@priemskiyyy/pulse/testing` imports no test runner and registers no test.

## The mock adapter

`createMockAdapter({ initial?, deferInitial? })` answers `{ adapter, emit, error, resolveInitial, stats, unsafe }`. Each `observe` reports the current source snapshot, unknown by default, unless `deferInitial` holds it for `resolveInitial()`, which never overwrites a newer `emit`. `emit` forwards duplicates on purpose. `stats()` counts observations started, closed and active. `unsafe.emitAfterCleanup` and `unsafe.errorAfterCleanup` call the latest observation after its cleanup, for hostile tests.

## The clock

`createTestClock(initial = 0)` answers `{ now, advance, set }`. It creates no timer. `advance` moves forward only; `set` can move backwards to test a rollback. Both refuse a non-finite number with a `RangeError`. To test a throwing or NaN clock, pass your own `now`.

## Adapter conformance

`testLifecycleAdapter(createHarness)` runs its checks against a fresh harness each and cleans up even after a failure. It answers `{ passed }`, or throws one error naming every failed check. See [custom adapters](custom-adapters.md).
