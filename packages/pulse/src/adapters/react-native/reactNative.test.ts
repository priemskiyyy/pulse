import { afterEach, expect, test, vi } from "vitest";

import { reactNative } from "src/adapters/react-native/reactNative";
import { createAppState } from "src/adapters/react-native/reactNative.fixture";
import { createTestClock } from "src/testing/createTestClock";
import { testLifecycleAdapter } from "src/testing/testLifecycleAdapter";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import type { PulseErrorContext } from "src/types/PulseErrorContext";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";
import { recordDelivery } from "src/utils/Pulse.fixture";

afterEach(() => {
  vi.restoreAllMocks();
});

const startOn = (
  host: ReturnType<typeof createAppState>,
  platform: "ios" | "android",
) => {
  const clock = createTestClock(1_000);
  const reports: Array<[unknown, PulseErrorContext]> = [];

  const pulse = new Pulse({
    adapter: reactNative({ appState: host.appState, platform }),
    now: clock.now,
    onError: (error, context) => reports.push([error, context]),
  });

  const log = recordDelivery(pulse);
  const entries: ForegroundEvent[] = [];

  pulse.on("foreground", (event) => entries.push(event));
  pulse.start();

  return { pulse, log, clock, entries, reports };
};

const getState = (pulse: Pulse) => {
  const { phase, interaction } = pulse.state.get();

  return `${phase}/${interaction}`;
};

const getTransitions = (log: string[]) =>
  log.filter((entry) => !entry.startsWith("state"));

test("N-001 N-002 iOS baselines map active and inactive without an edge", () => {
  const active = startOn(createAppState("active"), "ios");
  const inactive = startOn(createAppState("inactive"), "ios");

  expect(active.log).toEqual(["state foreground/available"]);
  expect(inactive.log).toEqual(["state foreground/unavailable"]);
});

test("N-003 an iOS background baseline enters foreground with no duration", () => {
  const host = createAppState("background");
  const { log, entries } = startOn(host, "ios");

  host.change("active");

  expect(log).toEqual([
    "state background/unavailable",
    "state foreground/available",
    "foreground #2",
  ]);
  expect(entries[0]?.observedAway).toBeNull();
});

test("N-004 iOS active, inactive, active changes interaction only", () => {
  const host = createAppState("active");
  const { log } = startOn(host, "ios");

  host.change("inactive");
  host.change("active");

  expect(getTransitions(log)).toEqual([]);
  expect(log).toHaveLength(3);
});

test("N-005 iOS active, inactive, background is one background edge, at background", () => {
  const host = createAppState("active");
  const { log } = startOn(host, "ios");

  host.change("inactive");
  host.change("background");

  expect(getTransitions(log)).toEqual(["background #3"]);
});

test("N-006 iOS background, inactive, active enters foreground at inactive", () => {
  const host = createAppState("background");
  const { log } = startOn(host, "ios");

  host.change("inactive");
  host.change("active");

  expect(log).toEqual([
    "state background/unavailable",
    "state foreground/unavailable",
    "foreground #2",
    "state foreground/available",
  ]);
});

test("N-007 an iOS direct background to active is one edge with a paired duration", () => {
  const host = createAppState("active");
  const { clock, entries } = startOn(host, "ios");

  clock.set(2_000);
  host.change("background");
  clock.set(6_500);
  host.change("active");

  expect(entries.map((event) => event.observedAway)).toEqual([4_500]);
});

test("N-008 an unresolved current state is unknown, with listeners attached and no timer", () => {
  const timers = [
    vi.spyOn(globalThis, "setTimeout"),
    vi.spyOn(globalThis, "setInterval"),
  ];

  for (const initial of [null, undefined, "unknown"]) {
    const host = createAppState(initial);
    const { pulse, log } = startOn(host, "ios");

    expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
    expect(log).toEqual([]);
    expect(host.subscriptionCount()).toBe(1);

    host.change("active");
    expect(getState(pulse)).toBe("foreground/available");
  }

  expect(timers.every((timer) => timer.mock.calls.length === 0)).toBe(true);
});

test("N-009 N-018 extension, unknown and unmapped values are unknown on both axes", () => {
  const cases: Array<["ios" | "android", string]> = [
    ["ios", "extension"],
    ["ios", "unknown"],
    ["ios", "suspended"],
    ["android", "inactive"],
    ["android", "extension"],
  ];

  for (const [platform, value] of cases) {
    const host = createAppState("active");
    const { pulse } = startOn(host, platform);

    host.change(value);
    expect(getState(pulse)).toBe("unknown/unknown");
  }
});

test("N-010 an Android active baseline has unknown interaction", () => {
  const { log } = startOn(createAppState("active"), "android");

  expect(log).toEqual(["state foreground/unknown"]);
});

test("N-011 the Android notification drawer changes interaction, never phase", () => {
  const host = createAppState("active");
  const { log } = startOn(host, "android");

  host.blur();
  host.focus();

  expect(log).toEqual([
    "state foreground/unknown",
    "state foreground/unavailable",
    "state foreground/available",
  ]);
});

test("N-012 N-017 Android focus that arrives before active is kept, even across a duplicate background", () => {
  const host = createAppState("background");
  const { pulse, log } = startOn(host, "android");

  host.focus();
  host.change("background");
  host.change("active");

  expect(getState(pulse)).toBe("foreground/available");
  expect(getTransitions(log)).toEqual(["foreground #2"]);
});

test("N-013 Android focus after active is unknown first, then available, with one edge", () => {
  const host = createAppState("background");
  const { log } = startOn(host, "android");

  host.change("active");
  host.focus();

  expect(log).toEqual([
    "state background/unavailable",
    "state foreground/unknown",
    "foreground #2",
    "state foreground/available",
  ]);
});

test("N-014 N-015 old Android focus or blur never crosses a new departure", () => {
  const signals: Array<"focus" | "blur"> = ["focus", "blur"];

  for (const signal of signals) {
    const host = createAppState("active");
    const { pulse } = startOn(host, "android");

    host[signal]();
    host.change("background");
    host.change("active");

    expect(getState(pulse)).toBe("foreground/unknown");
  }
});

test("N-016 a duplicate Android active keeps the current focus evidence", () => {
  const host = createAppState("active");
  const { pulse } = startOn(host, "android");

  host.focus();
  host.change("active");

  expect(getState(pulse)).toBe("foreground/available");
});

test("N-019 an Android unknown invalidates focus evidence and phase continuity", () => {
  const host = createAppState("active");
  const { pulse, log } = startOn(host, "android");

  host.focus();
  host.change("unknown");
  host.change("active");

  expect(getState(pulse)).toBe("foreground/unknown");
  expect(getTransitions(log)).toEqual([]);

  host.focus();
  host.change("background");
  host.focus();
  host.change("unknown");
  host.change("active");

  expect(getState(pulse)).toBe("foreground/unknown");
});

test("N-020 a focus during registration does not skip the app state read", () => {
  const host = createAppState("active");
  const read = vi.fn(() => "active");

  Object.defineProperty(host.appState, "currentState", { get: read });

  host.faults.subscribe = (type) => {
    if (type === "blur") {
      host.focus();
    }
  };

  const { pulse } = startOn(host, "android");

  expect(read).toHaveBeenCalledTimes(1);
  expect(getState(pulse)).toBe("foreground/available");
});

test("N-021 a change during the initial read wins over the stale baseline", () => {
  const host = createAppState("active");

  Object.defineProperty(host.appState, "currentState", {
    get: () => {
      host.change("background");

      return "active";
    },
    set: () => {},
  });

  const { pulse, log } = startOn(host, "ios");

  expect(getState(pulse)).toBe("background/unavailable");
  expect(log).toEqual(["state background/unavailable"]);
});

test("N-022 N-023 N-024 an unavailable AppState, the web and unmapped platforms are unavailable", () => {
  const unavailable = createAppState("active");

  unavailable.appState.isAvailable = false;

  const cases: Array<[ReturnType<typeof createAppState>, string]> = [
    [unavailable, "ios"],
    [createAppState("active"), "web"],
    [createAppState("active"), "windows"],
    [createAppState("active"), "macos"],
  ];

  for (const [host, platform] of cases) {
    const adapter = reactNative({ appState: host.appState, platform });
    const pulse = new Pulse({ adapter });

    expect(adapter.available()).toBe(false);
    pulse.start();
    expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
    expect(host.subscriptionCount()).toBe(0);
  }

  expect(
    reactNative({
      appState: createAppState("active").appState,
      platform: "android",
    }).available(),
  ).toBe(true);
});

test("iOS registers no Android-only focus or blur listener", () => {
  const host = createAppState("active");

  startOn(host, "ios");

  expect(host.listeners.focus.size + host.listeners.blur.size).toBe(0);
  expect(host.subscriptionCount()).toBe(1);
});

test("N-025 a failed or unusable registration removes every subscription already acquired", () => {
  const refused = createAppState("active");
  const failure = new Error("registration refused");

  refused.faults.subscribe = (type) => {
    if (type === "blur") {
      throw failure;
    }
  };

  const pulse = new Pulse({
    adapter: reactNative({ appState: refused.appState, platform: "android" }),
  });

  expect(() => pulse.start()).toThrow(
    expect.objectContaining({ code: "START_FAILED", cause: failure }),
  );
  expect(refused.subscriptionCount()).toBe(0);

  const unusable = createAppState("active");
  const addEventListener = unusable.appState.addEventListener;

  unusable.appState.addEventListener = (
    type,
    listener,
  ): { remove: () => void } => {
    const subscription = addEventListener(type, listener);
    const broken = {};

    // @ts-expect-error A broken AppState can answer anything.
    return type === "focus" ? broken : subscription;
  };

  expect(() =>
    new Pulse({
      adapter: reactNative({
        appState: unusable.appState,
        platform: "android",
      }),
    }).start(),
  ).toThrow(expect.objectContaining({ code: "START_FAILED" }));
  expect(unusable.listeners.change.size).toBe(0);
});

test("N-026 a throwing removal lets the others run, is reported once and never retried", () => {
  const host = createAppState("active");
  const failure = new Error("removal refused");

  const remove = vi.fn((type: string) => {
    if (type === "focus") {
      throw failure;
    }
  });

  host.faults.remove = remove;

  const { pulse, reports } = startOn(host, "android");

  pulse.dispose();
  pulse.dispose();

  expect(remove.mock.calls).toEqual([["blur"], ["focus"], ["change"]]);
  expect(host.listeners.focus.size).toBe(1);
  expect(host.listeners.change.size + host.listeners.blur.size).toBe(0);
  expect(reports).toEqual([
    [
      expect.objectContaining({ errors: [failure] }),
      { origin: "cleanup", adapter: { name: "react-native" }, sequence: 1 },
    ],
  ]);
});

test("N-027 N-028 N-029 observations of one adapter are independent, and a closed one is silent", () => {
  const host = createAppState("active");
  const adapter = reactNative({ appState: host.appState, platform: "android" });
  const first = new Pulse({ adapter });
  const second = new Pulse({ adapter });

  first.start();

  const [closedChange] = [...host.listeners.change];

  second.start();
  host.focus();
  first.dispose();
  host.change("background");
  closedChange?.("background");

  expect(getState(first)).toBe("foreground/available");
  expect(getState(second)).toBe("background/unavailable");
  expect(host.subscriptionCount()).toBe(3);
  second.dispose();
  expect(host.subscriptionCount()).toBe(0);
});

test("N-030 creating the adapter, as a headless task would, subscribes to nothing", () => {
  const host = createAppState("active");
  const addEventListener = vi.spyOn(host.appState, "addEventListener");

  reactNative({ appState: host.appState, platform: "android" });
  new Pulse({
    adapter: reactNative({ appState: host.appState, platform: "ios" }),
  });

  expect(addEventListener).not.toHaveBeenCalled();
});

test("the adapter passes the conformance suite on both platforms", async () => {
  const platforms: Array<"ios" | "android"> = ["ios", "android"];

  for (const platform of platforms) {
    const report = await testLifecycleAdapter(() => {
      const host = createAppState("active");

      return {
        adapter: reactNative({ appState: host.appState, platform }),
        foreground: () => host.change("active"),
        background: () => host.change("background"),
        settle: async () => {},
        subscriptionCount: host.subscriptionCount,
        disposeHost: () => {},
      };
    });

    expect(report.passed).toHaveLength(8);
  }
});
