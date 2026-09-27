import { expectTypeOf } from "vitest";

import type {
  BackgroundEvent,
  ForegroundEvent,
  LifecycleAdapter,
  LifecycleSource,
  LifecycleState,
} from "src/index";
import { Pulse, UNKNOWN_LIFECYCLE_STATE } from "src/index";

declare const adapter: LifecycleAdapter;

const pulse = new Pulse({ adapter });

pulse.on("foreground", (event) => {
  expectTypeOf(event).toEqualTypeOf<ForegroundEvent>();
  expectTypeOf(event.from.phase).toEqualTypeOf<"background">();
  expectTypeOf(event.from.interaction).toEqualTypeOf<"unavailable">();
  expectTypeOf(event.to.phase).toEqualTypeOf<"foreground">();
  expectTypeOf(event.observedAway).toEqualTypeOf<number | null>();
});

pulse.on("background", (event) => {
  expectTypeOf(event).toEqualTypeOf<BackgroundEvent>();
  expectTypeOf(event.to.phase).toEqualTypeOf<"background">();
});

// @ts-expect-error "resume" is not a transition Pulse emits.
pulse.on("resume", () => {});

// @ts-expect-error A background event has no observed away time.
pulse.on("background", (event) => event.observedAway);

expectTypeOf(pulse.state.get()).toEqualTypeOf<LifecycleState>();
expectTypeOf(UNKNOWN_LIFECYCLE_STATE).toEqualTypeOf<LifecycleState>();

// @ts-expect-error The adapter is required.
export const withoutAdapter = new Pulse({});

// @ts-expect-error A clock answers epoch milliseconds.
export const withBadClock = new Pulse({ adapter, now: () => "now" });

// A Pulse is a structural source, and so is any object with the same readable.
export const source: LifecycleSource = pulse;

export const structural: LifecycleSource = {
  state: { get: () => UNKNOWN_LIFECYCLE_STATE, subscribe: () => () => {} },
};

// Services receive only what they need, never the ownership methods.
export const observer: Pick<Pulse, "state" | "on"> = pulse;

// A plain object is an adapter; there is no helper to build one.
export const custom: LifecycleAdapter = {
  name: "custom-host",
  observe: (next) => {
    next.next({ phase: "unknown", interaction: "available" });

    return () => {};
  },
};

export const asynchronous: LifecycleAdapter = {
  name: "async",
  // @ts-expect-error An adapter answers a synchronous cleanup, not a promise.
  observe: async () => () => {},
};

export const unknownPhase: LifecycleState = {
  // @ts-expect-error A phase outside the union is refused at compile time.
  phase: "active",
  interaction: "available",
};
