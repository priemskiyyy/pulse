import { afterEach, expect, test, vi } from "vitest";

import { browser } from "src/adapters/browser/browser";
import { createPage } from "src/adapters/browser/browser.fixture";
import { testLifecycleAdapter } from "src/testing/testLifecycleAdapter";
import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";
import { recordDelivery } from "src/utils/Pulse.fixture";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const startOn = (page: ReturnType<typeof createPage>) => {
  const pulse = new Pulse({ adapter: browser({ target: page.window }) });
  const log = recordDelivery(pulse);

  pulse.start();

  return { pulse, log };
};

const EXPECTED_REGISTRATIONS = [
  ["document", "visibilitychange"],
  ["window", "focus"],
  ["window", "blur"],
  ["window", "pagehide"],
  ["window", "pageshow"],
  ["document", "freeze"],
  ["document", "resume"],
  ["document", "prerenderingchange"],
];

test("B-001 creating the adapter reads no window or document", () => {
  const target = new Proxy(createPage().window, {
    get: () => {
      throw new Error("read too early");
    },
  });

  expect(() => browser()).not.toThrow();
  expect(() => browser({ target })).not.toThrow();
});

test("B-002 without a DOM the adapter is unavailable, and nothing is fabricated", () => {
  vi.stubGlobal("window", undefined);

  const onDiagnostic = vi.fn();
  const pulse = new Pulse({ adapter: browser(), onDiagnostic });

  expect(browser().available()).toBe(false);
  expect(() => pulse.start()).not.toThrow();
  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);
  expect(onDiagnostic.mock.calls).toEqual([
    [{ type: "unavailable", adapter: { name: "browser" } }],
  ]);
});

test("the default target is the global window, resolved when observation starts", () => {
  const page = createPage({ focused: false });

  vi.stubGlobal("window", page.window);

  const pulse = new Pulse({ adapter: browser() });

  pulse.start();
  expect(pulse.state.get()).toEqual({
    phase: "foreground",
    interaction: "unavailable",
  });
  pulse.dispose();
  expect(page.registrations).toEqual([]);
});

test("B-003 B-004 an injected window from another realm is observed through its own document only", () => {
  const observed = createPage();
  const other = createPage();
  const { pulse, log } = startOn(observed);

  other.hide();
  other.blur();
  expect(log).toEqual(["state foreground/available"]);
  expect(other.registrations).toEqual([]);
  expect(
    observed.registrations.map(({ target, type }) => [target, type]),
  ).toEqual(EXPECTED_REGISTRATIONS);
  pulse.dispose();
});

test("B-005 a detached window is unavailable and gets no listener", () => {
  const page = createPage();
  const iframe = page.document.querySelector("iframe");
  const child = iframe?.contentWindow;

  if (child === null || child === undefined) {
    throw new Error("The fixture has no iframe window.");
  }

  const adapter = browser({ target: child });

  expect(adapter.available()).toBe(true);
  iframe?.remove();
  expect(adapter.available()).toBe(false);
});

test("B-006 B-007 B-008 each baseline commits without a transition", () => {
  const focused = startOn(createPage());
  const unfocused = startOn(createPage({ focused: false }));
  const hidden = startOn(createPage({ visibility: "hidden" }));

  expect(focused.log).toEqual(["state foreground/available"]);
  expect(unfocused.log).toEqual(["state foreground/unavailable"]);
  expect(hidden.log).toEqual(["state background/unavailable"]);
});

test("B-014 switching windows while visible changes interaction, not phase", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.blur();
  page.focus();

  expect(log).toEqual([
    "state foreground/available",
    "state foreground/unavailable",
    "state foreground/available",
  ]);
});

test("B-015 B-016 a hidden and visible page is two edges, whatever order focus arrives in", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.blur();
  page.hide();
  page.show();
  page.focus();

  expect(log.filter((entry) => !entry.startsWith("state"))).toEqual([
    "background #3",
    "foreground #4",
  ]);
});

test("B-017 B-021 B-022 duplicate events and equal samples commit nothing", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.fire(page.document, "visibilitychange");
  page.fire(page.window, "focus");
  page.hide();
  page.blur();
  page.fire(page.document, "visibilitychange");
  page.page.focused = true;
  page.fire(page.window, "focus");

  expect(log).toEqual([
    "state foreground/available",
    "state background/unavailable",
    "background #2",
  ]);
});

test("B-018 focus moving between controls never touches interaction", () => {
  const page = createPage();
  const hasFocus = vi.spyOn(page.document, "hasFocus");
  const { log } = startOn(page);
  const [first, second] = page.document.querySelectorAll("input");

  hasFocus.mockClear();
  first?.focus();
  second?.focus();
  second?.blur();

  expect(hasFocus).not.toHaveBeenCalled();
  expect(log).toEqual(["state foreground/available"]);
});

test("B-019 focus moving into an iframe samples the bound document", () => {
  const page = createPage();
  const { log, pulse } = startOn(page);

  // The browser still reports focus for a document whose iframe holds it.
  page.fire(page.window, "blur");

  expect(pulse.state.get()).toEqual({
    phase: "foreground",
    interaction: "available",
  });
  expect(log).toEqual(["state foreground/available"]);
});

test("B-020 hiding the application with CSS is not a page phase change", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.document.body.style.display = "none";
  page.document.body.style.visibility = "hidden";

  expect(log).toEqual(["state foreground/available"]);
});

test("B-042 a sample taken while the host dispatched a newer event cannot overwrite it", () => {
  const page = createPage();
  let reentered = false;

  Object.defineProperty(page.document, "hasFocus", {
    value: () => {
      if (!reentered) {
        reentered = true;
        page.hide();
      }

      return true;
    },
  });

  const { pulse, log } = startOn(page);

  expect(pulse.state.get()).toEqual({
    phase: "background",
    interaction: "unavailable",
  });
  expect(log).toEqual(["state background/unavailable"]);
});

test("B-045 B-046 only Pulse's own capture listeners come and go, and no handler property is touched", () => {
  const page = createPage();
  const application = vi.fn();

  const scheduled = [
    vi.spyOn(page.window, "setTimeout"),
    vi.spyOn(page.window, "setInterval"),
    vi.spyOn(page.window, "requestAnimationFrame"),
  ];

  page.window.addEventListener("pagehide", application);
  page.window.onpageshow = application;

  const { pulse } = startOn(page);

  expect(
    page.registrations
      .filter(({ listener }) => listener !== application)
      .every(({ capture }) => capture),
  ).toBe(true);
  expect(
    page.registrations.some(({ type }) =>
      [
        "unload",
        "beforeunload",
        "keydown",
        "pointerdown",
        "popstate",
        "hashchange",
      ].includes(type),
    ),
  ).toBe(false);

  pulse.dispose();
  page.pageHide(false);
  page.pageShow(false);

  expect(page.registrations).toEqual([
    {
      target: "window",
      type: "pagehide",
      listener: application,
      capture: false,
    },
  ]);
  expect(page.window.onpageshow).toBe(application);
  expect(application).toHaveBeenCalledTimes(2);
  expect(scheduled.every((spy) => spy.mock.calls.length === 0)).toBe(true);
});

test("a closed observation stays silent even if the host keeps its listener", () => {
  const page = createPage();
  const next = vi.fn<(state: LifecycleState) => void>();
  const observer: LifecycleObserver = { next, error: () => {} };

  vi.spyOn(page.window, "removeEventListener").mockImplementation(() => {});
  vi.spyOn(page.document, "removeEventListener").mockImplementation(() => {});

  const cleanup = browser({ target: page.window }).observe(observer);

  next.mockClear();
  cleanup();
  cleanup();
  page.hide();
  page.pageHide(true);

  expect(next).not.toHaveBeenCalled();
});

test("the browser adapter passes the conformance suite on a real document", async () => {
  const report = await testLifecycleAdapter(() => {
    const page = createPage();

    return {
      adapter: browser({ target: page.window }),
      foreground: () => page.show(),
      background: () => page.hide(),
      settle: async () => {},
      subscriptionCount: () => page.registrations.length,
      disposeHost: () => page.window.close(),
    };
  });

  expect(report.passed).toHaveLength(8);
});

test("B-011 a throwing focus getter publishes foreground/unknown before reporting", () => {
  const page = createPage();
  const failure = new Error("hasFocus threw");
  const order: string[] = [];

  const pulse = new Pulse({
    adapter: browser({ target: page.window }),
    onError: (error, { origin }) => {
      const { phase, interaction } = pulse.state.get();

      order.push(
        `${origin} ${String(error === failure)} ${phase}/${interaction}`,
      );
    },
  });

  pulse.start();
  vi.spyOn(page.document, "hasFocus").mockImplementation(() => {
    throw failure;
  });
  page.blur();

  expect(pulse.state.get()).toEqual({
    phase: "foreground",
    interaction: "unknown",
  });
  expect(order).toEqual(["adapter true foreground/unknown"]);
});

// A window whose listener methods can fail, over the fixture's tracked one.
const createFailingTarget = (
  page: ReturnType<typeof createPage>,
  failing: { add?: string; remove?: string },
) => ({
  document: page.document,
  dispatchEvent: (event: Event) => page.window.dispatchEvent(event),
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    if (type === failing.add) {
      throw new Error(`adding ${type} threw`);
    }

    page.window.addEventListener(type, listener, options);
  },
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => {
    if (type === failing.remove) {
      throw new Error(`removing ${type} threw`);
    }

    page.window.removeEventListener(type, listener, options);
  },
});

const silentObserver: LifecycleObserver = { next: () => {}, error: () => {} };

test("B-043 a listener registration that throws removes the ones already installed", () => {
  const page = createPage();

  const adapter = browser({
    target: createFailingTarget(page, { add: "pagehide" }),
  });

  expect(() => adapter.observe(silentObserver)).toThrow(
    "adding pagehide threw",
  );
  expect(page.registrations).toEqual([]);
});

test("B-044 a removal that throws does not stop the others", () => {
  const page = createPage();

  const adapter = browser({
    target: createFailingTarget(page, { remove: "blur" }),
  });

  const cleanup = adapter.observe(silentObserver);

  expect(cleanup).toThrow("removing blur threw");
  expect(page.registrations.map(({ type }) => type)).toEqual(["blur"]);
  expect(() => cleanup()).not.toThrow();
});
