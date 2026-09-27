import { afterEach, expect, test, vi } from "vitest";

import { createMockAdapter } from "src/testing/createMockAdapter";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";
import {
  BACKGROUND,
  createCapturingAdapter,
  FOREGROUND,
  recordDelivery,
} from "src/utils/Pulse.fixture";

afterEach(() => {
  vi.restoreAllMocks();
});

const expectCode = (run: () => unknown, code: string) => {
  expect(run).toThrow(expect.objectContaining({ name: "PulseError", code }));
};

test("C-001 constructing observes nothing, reads no host and samples no clock", () => {
  const observe = vi.fn(() => () => {});
  const now = vi.fn(() => 0);

  const pulse = new Pulse({
    adapter: { name: "spy", available: () => true, observe },
    now,
  });

  pulse.state.get();
  expect(observe).not.toHaveBeenCalled();
  expect(now).not.toHaveBeenCalled();
});

test("C-002 the first snapshot is the exported frozen unknown constant", () => {
  const pulse = new Pulse({ adapter: createMockAdapter().adapter });

  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(Object.isFrozen(UNKNOWN_LIFECYCLE_STATE)).toBe(true);
});

test("C-003 C-004 the readable and its methods keep their identity and work detached", () => {
  const mock = createMockAdapter();
  const pulse = new Pulse({ adapter: mock.adapter });
  const { state } = pulse;
  const { get, subscribe } = state;
  const listener = vi.fn();

  subscribe(listener);
  pulse.start();
  mock.emit(FOREGROUND);

  expect(pulse.state).toBe(state);
  expect(pulse.state.get).toBe(get);
  expect(pulse.state.subscribe).toBe(subscribe);
  expect(Object.isFrozen(state)).toBe(true);
  expect(get()).toEqual(FOREGROUND);
  expect(get()).toBe(get());
  expect(listener).toHaveBeenCalledTimes(1);
});

test("C-005 subscribing to state or transitions starts nothing", () => {
  const mock = createMockAdapter();
  const pulse = new Pulse({ adapter: mock.adapter });

  pulse.state.subscribe(() => {});
  pulse.on("foreground", () => {});
  pulse.on("background", () => {});

  expect(mock.stats().observationsStarted).toBe(0);
});

test("C-006 a new subscriber hears neither the current state nor an old event", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });

  pulse.start();
  mock.emit(BACKGROUND);

  const log = recordDelivery(pulse);

  expect(log).toEqual([]);
  mock.emit(FOREGROUND);
  expect(log).toEqual(["state foreground/available", "foreground #3"]);
});

test("C-007 C-008 start observes once, even when called again from setup or a listener", () => {
  let pulse: Pulse | null = null;

  const { adapter, observers } = createCapturingAdapter((observer) => {
    pulse?.start();
    observer.next(FOREGROUND);
  });

  const created = new Pulse({ adapter });

  pulse = created;
  created.state.subscribe(() => created.start());
  created.start();
  created.start();

  expect(observers).toHaveLength(1);
  expect(created.state.get()).toEqual(FOREGROUND);
});

test("C-009 a setup-time baseline is delivered only once the cleanup is owned", () => {
  const order: string[] = [];

  const adapter: LifecycleAdapter = {
    name: "synchronous",
    available: () => true,
    observe: (observer) => {
      observer.next(FOREGROUND);
      order.push("setup returned");

      return () => {};
    },
  };

  const pulse = new Pulse({ adapter });

  pulse.state.subscribe(() => order.push("state"));
  pulse.start();

  expect(order).toEqual(["setup returned", "state"]);
});

test("C-010 a setup that emits then throws publishes nothing and keeps the cause", () => {
  const failure = new Error("setup failed");
  const onError = vi.fn();

  const { adapter } = createCapturingAdapter((observer) => {
    observer.next(FOREGROUND);
    throw failure;
  });

  const pulse = new Pulse({ adapter, onError });
  const log = recordDelivery(pulse);

  expect(() => pulse.start()).toThrow(
    expect.objectContaining({ code: "START_FAILED", cause: failure }),
  );
  expect(log).toEqual([]);
  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(onError).not.toHaveBeenCalled();
});

test("C-011 a setup that reports an error then throws surfaces the failure once", () => {
  const onError = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  const { adapter } = createCapturingAdapter((observer) => {
    observer.error(new Error("reported"));
    throw new Error("thrown");
  });

  const pulse = new Pulse({ adapter, onError });

  expectCode(() => pulse.start(), "START_FAILED");
  expect(onError).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
});

test("C-013 a dispose during setup runs the cleanup once and publishes nothing", () => {
  let pulse: Pulse | null = null;
  const cleanup = vi.fn();

  const { adapter } = createCapturingAdapter((observer) => {
    observer.next(FOREGROUND);
    pulse?.dispose();
    observer.next(BACKGROUND);

    return cleanup;
  });

  const created = new Pulse({ adapter });
  const log = recordDelivery(created);

  pulse = created;
  created.start();

  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(log).toEqual([]);
  expect(created.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
  created.dispose();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

test("C-014 a dispose during the first delivery drops every later buffered input", () => {
  const { adapter } = createCapturingAdapter((observer) => {
    observer.next(FOREGROUND);
    observer.next(BACKGROUND);
    observer.next(FOREGROUND);
  });

  const pulse = new Pulse({ adapter });
  const listener = vi.fn(() => pulse.dispose());
  const onForeground = vi.fn();

  pulse.state.subscribe(listener);
  pulse.on("background", onForeground);
  pulse.start();

  expect(listener).toHaveBeenCalledTimes(1);
  expect(onForeground).not.toHaveBeenCalled();
  expect(pulse.state.get()).toEqual(FOREGROUND);
});

test("C-015 C-016 a failed instance never retries and refuses new registrations", () => {
  const observe = vi.fn(() => {
    throw new Error("no host");
  });

  const pulse = new Pulse({
    adapter: { name: "failing", available: () => true, observe },
  });

  const stop = pulse.state.subscribe(() => {});

  expectCode(() => pulse.start(), "START_FAILED");
  expectCode(() => pulse.start(), "FAILED_INSTANCE");
  expectCode(() => pulse.state.subscribe(() => {}), "FAILED_INSTANCE");
  expectCode(() => pulse.on("foreground", () => {}), "FAILED_INSTANCE");
  expect(() => stop()).not.toThrow();
  expect(observe).toHaveBeenCalledTimes(1);

  pulse.dispose();
  expectCode(() => pulse.start(), "DISPOSED");
});

test("C-017 a dispose before start acquires nothing, and start then throws", () => {
  const mock = createMockAdapter();
  const pulse = new Pulse({ adapter: mock.adapter });

  pulse.dispose();

  expectCode(() => pulse.start(), "DISPOSED");
  expect(mock.stats().observationsStarted).toBe(0);
});

test("C-018 C-019 C-020 disposal is terminal, idempotent and keeps the last state readable", () => {
  const cleanup = vi.fn();

  const { adapter } = createCapturingAdapter((observer) => {
    observer.next(FOREGROUND);

    return cleanup;
  });

  const pulse = new Pulse({ adapter });

  pulse.start();

  const last = pulse.state.get();

  pulse.dispose();
  pulse.dispose();

  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(pulse.state.get()).toBe(last);
  expect(last).toEqual(FOREGROUND);
  expectCode(() => pulse.start(), "DISPOSED");
  expectCode(() => pulse.state.subscribe(() => {}), "DISPOSED");
  expectCode(() => pulse.on("background", () => {}), "DISPOSED");
});

test("C-021 an unsubscribe is idempotent and removes only its own registration", () => {
  const mock = createMockAdapter();
  const pulse = new Pulse({ adapter: mock.adapter });
  const first = vi.fn();
  const second = vi.fn();
  const stop = pulse.state.subscribe(first);

  pulse.state.subscribe(second);
  stop();
  stop();
  pulse.start();
  mock.emit(FOREGROUND);

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
});

test("C-022 the same function registered twice is two independent registrations", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const listener = vi.fn();
  const onBackground = vi.fn();
  const stop = pulse.state.subscribe(listener);

  pulse.state.subscribe(listener);
  pulse.on("background", onBackground);

  const stopEvent = pulse.on("background", onBackground);

  pulse.start();
  expect(listener).toHaveBeenCalledTimes(2);

  stop();
  stopEvent();
  mock.emit(BACKGROUND);
  expect(listener).toHaveBeenCalledTimes(3);
  expect(onBackground).toHaveBeenCalledTimes(1);
});

test("an unavailable adapter is never observed, and the state stays unknown", () => {
  const observe = vi.fn(() => () => {});
  const onDiagnostic = vi.fn();
  const listener = vi.fn();

  const pulse = new Pulse({
    adapter: { name: "server", available: () => false, observe },
    onDiagnostic,
  });

  pulse.state.subscribe(listener);
  pulse.start();
  pulse.start();

  expect(observe).not.toHaveBeenCalled();
  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(onDiagnostic.mock.calls).toEqual([
    [{ type: "unavailable", adapter: { name: "server" } }],
  ]);
  expect(listener).not.toHaveBeenCalled();
  expect(() => pulse.on("foreground", () => {})).not.toThrow();
  pulse.dispose();
  expectCode(() => pulse.start(), "DISPOSED");
});
