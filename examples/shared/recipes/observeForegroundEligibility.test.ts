import type { LifecycleSource, LifecycleState } from "@priemskiyyy/pulse";
import { Pulse } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";
import { expect, test, vi } from "vitest";

import { observeForegroundEligibility } from "example-shared/recipes/observeForegroundEligibility";

const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "available",
};

const FOREGROUND_UNAVAILABLE: LifecycleState = {
  phase: "foreground",
  interaction: "unavailable",
};

const BACKGROUND: LifecycleState = {
  phase: "background",
  interaction: "unavailable",
};

// A source whose live subscriptions the test can count.
const countSubscriptions = (pulse: Pulse) => {
  let subscriptions = 0;

  const source: LifecycleSource = {
    state: {
      get: pulse.state.get,
      subscribe: (listener) => {
        const stop = pulse.state.subscribe(listener);

        subscriptions += 1;

        return () => {
          subscriptions -= 1;
          stop();
        };
      },
    },
  };

  return { source, count: () => subscriptions };
};

test("I-001 a late service is reconciled with the current state, not a replayed event", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const apply = vi.fn();

  pulse.start();
  observeForegroundEligibility(pulse, apply);

  expect(apply.mock.calls).toEqual([[true]]);
});

test("I-002 unknown is ineligible, and only a change of eligibility is applied", () => {
  const mock = createMockAdapter();
  const pulse = new Pulse({ adapter: mock.adapter });
  const apply = vi.fn();

  observeForegroundEligibility(pulse, apply);
  pulse.start();
  mock.emit(FOREGROUND);
  mock.emit(FOREGROUND_UNAVAILABLE);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);

  expect(apply.mock.calls).toEqual([[false], [true], [false], [true]]);
});

test("I-003 a throwing first reconciliation removes its own subscription", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const { source, count } = countSubscriptions(pulse);
  const failure = new Error("apply failed");

  pulse.start();

  expect(() =>
    observeForegroundEligibility(source, () => {
      throw failure;
    }),
  ).toThrow(failure);
  expect(count()).toBe(0);
});

test("I-017 stopping the service removes only its subscription and starts or disposes nothing", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const { source, count } = countSubscriptions(pulse);
  const stop = observeForegroundEligibility(source, () => {});

  expect(mock.stats().observationsStarted).toBe(0);
  stop();
  stop();
  expect(count()).toBe(0);
  pulse.dispose();
});
