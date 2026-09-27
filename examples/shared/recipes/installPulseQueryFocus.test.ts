import type { LifecycleSource, LifecycleState } from "@priemskiyyy/pulse";
import { Pulse } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";
import { focusManager } from "@tanstack/query-core";
import { afterEach, expect, test } from "vitest";

import { installPulseQueryFocus } from "example-shared/recipes/installPulseQueryFocus";

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

// The manager is a shared singleton: every test leaves it with a known, inert setup.
afterEach(() => {
  focusManager.setEventListener(() => () => {});
  focusManager.setFocused(undefined);
});

const recordFocus = () => {
  const changes: boolean[] = [];
  const stop = focusManager.subscribe((focused) => changes.push(focused));

  return { changes, stop };
};

test("I-004 an unknown baseline is unfocused, then the known state takes over", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });

  installPulseQueryFocus(pulse, focusManager);
  expect(focusManager.isFocused()).toBe(false);

  pulse.start();
  expect(focusManager.isFocused()).toBe(true);
});

test("I-005 I-006 I-007 repeated states, focus-only changes and iOS inactive keep Query focused", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });

  pulse.start();
  installPulseQueryFocus(pulse, focusManager);

  const { changes, stop } = recordFocus();

  mock.emit(FOREGROUND);
  mock.emit(FOREGROUND_UNAVAILABLE);
  mock.emit(FOREGROUND);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND_UNAVAILABLE);

  expect(changes).toEqual([false, true]);
  stop();
});

test("I-008 a second install replaces the first, whose cleanup cannot touch the new state", () => {
  const first = createMockAdapter({ initial: BACKGROUND });
  const second = createMockAdapter({ initial: FOREGROUND });
  const firstPulse = new Pulse({ adapter: first.adapter });
  const secondPulse = new Pulse({ adapter: second.adapter });
  let firstSubscriptions = 0;

  const counted: LifecycleSource = {
    state: {
      get: firstPulse.state.get,
      subscribe: (listener) => {
        const stop = firstPulse.state.subscribe(listener);

        firstSubscriptions += 1;

        return () => {
          firstSubscriptions -= 1;
          stop();
        };
      },
    },
  };

  firstPulse.start();
  secondPulse.start();
  installPulseQueryFocus(counted, focusManager);
  expect(focusManager.isFocused()).toBe(false);

  installPulseQueryFocus(secondPulse, focusManager);
  first.emit(FOREGROUND);
  first.emit(BACKGROUND);

  expect(firstSubscriptions).toBe(0);
  expect(focusManager.isFocused()).toBe(true);
});

test("I-009 installing never starts Pulse, and the manager's own resubscription leaks nothing", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });

  installPulseQueryFocus(pulse, focusManager);

  const first = recordFocus();

  first.stop();

  const second = recordFocus();

  pulse.start();
  second.stop();

  expect(mock.stats().observationsStarted).toBe(1);
  expect(focusManager.isFocused()).toBe(true);
});
