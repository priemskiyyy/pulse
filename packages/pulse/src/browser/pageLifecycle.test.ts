import { afterEach, expect, test, vi } from "vitest";

import { browser } from "src/browser/browser";
import { createPage } from "src/browser/browser.fixture";
import { createTestClock } from "src/testing/createTestClock";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
import { Pulse } from "src/utils/Pulse";
import { recordDelivery } from "src/utils/Pulse.fixture";

afterEach(() => {
  vi.restoreAllMocks();
});

const startOn = (page: ReturnType<typeof createPage>) => {
  const clock = createTestClock(1_000);

  const pulse = new Pulse({
    adapter: browser({ target: page.window }),
    now: clock.now,
  });

  const log = recordDelivery(pulse);
  const entries: ForegroundEvent[] = [];

  pulse.on("foreground", (event) => entries.push(event));
  pulse.start();

  return { pulse, log, clock, entries };
};

const getTransitions = (log: string[]) =>
  log.filter((entry) => !entry.startsWith("state"));

test("B-023 a pagehide while foreground latches one background edge", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.pageHide(true);

  expect(log).toEqual([
    "state foreground/available",
    "state background/unavailable",
    "background #2",
  ]);
});

test("B-024 a pagehide after an observed hidden is no second edge and keeps the departure", () => {
  const page = createPage();
  const { log, clock, entries } = startOn(page);

  clock.set(2_000);
  page.hide();
  clock.set(3_000);
  page.pageHide(true);
  clock.set(6_500);
  page.show();
  page.pageShow(true);

  expect(getTransitions(log)).toEqual(["background #2", "foreground #3"]);
  expect(entries[0]?.observedAway).toBe(4_500);
});

test("B-025 B-026 a pagehide latches whether or not the page may be cached, and never disposes", () => {
  for (const persisted of [true, false]) {
    const page = createPage();
    const { pulse, log } = startOn(page);

    page.pageHide(persisted);
    page.pageShow(false);

    expect(getTransitions(log)).toEqual(["background #2", "foreground #3"]);
    expect(page.registrations).toHaveLength(8);
    pulse.dispose();
  }
});

test("B-027 B-028 nothing but pageshow clears the latch, however visible the page looks", () => {
  const page = createPage();
  const { log, pulse } = startOn(page);

  page.pageHide(true);
  page.fire(page.document, "resume");
  page.focus();
  page.show();
  page.fire(page.document, "freeze");

  expect(pulse.state.get()).toEqual({
    phase: "background",
    interaction: "unavailable",
  });
  expect(getTransitions(log)).toEqual(["background #2"]);
});

test("B-029 B-032 a visible restore is one entry, however many signals announce it", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.hide();
  page.pageHide(true);
  page.fire(page.document, "freeze");
  page.page.visibility = "visible";
  page.fire(page.document, "resume");
  page.pageShow(true);
  page.focus();
  page.fire(page.document, "visibilitychange");

  expect(getTransitions(log)).toEqual(["background #2", "foreground #3"]);
});

test("B-030 a hidden restore stays background until the page is actually visible", () => {
  const page = createPage();
  const { log, pulse } = startOn(page);

  page.hide();
  page.pageHide(true);
  page.pageShow(true);

  expect(pulse.state.get().phase).toBe("background");

  page.show();

  expect(getTransitions(log)).toEqual(["background #2", "foreground #3"]);
});

test("B-031 the initial pageshow repeats the baseline and is no transition", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.pageShow(false);

  expect(log).toEqual(["state foreground/available"]);
});

test("B-033 B-034 freeze and resume only resample: no execution state, no invented edge", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.fire(page.document, "freeze");
  page.fire(page.document, "resume");
  expect(log).toEqual(["state foreground/available"]);

  page.hide();
  page.fire(page.document, "resume");
  expect(getTransitions(log)).toEqual(["background #2"]);
});

test("B-035 an engine without freeze or resume leaves no timer standing in for them", () => {
  const page = createPage();

  const timers = [
    vi.spyOn(page.window, "setTimeout"),
    vi.spyOn(page.window, "setInterval"),
    vi.spyOn(globalThis, "setTimeout"),
    vi.spyOn(globalThis, "setInterval"),
  ];

  const { pulse } = startOn(page);

  page.hide();
  page.show();
  pulse.dispose();

  expect(timers.every((timer) => timer.mock.calls.length === 0)).toBe(true);
});

test("B-036 a missed pagehide still forms one entry from an observed hidden", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.hide();
  page.pageShow(true);
  page.show();

  expect(getTransitions(log)).toEqual(["background #2", "foreground #3"]);
});

test("B-037 when every departure signal was missed, a persisted pageshow invents nothing", () => {
  const page = createPage();
  const { log } = startOn(page);

  page.pageShow(true);
  page.focus();

  expect(log).toEqual(["state foreground/available"]);
});

test("B-038 a reloaded document is a new instance with no restored pair", () => {
  const first = createPage();
  const before = startOn(first);

  first.hide();
  before.pulse.dispose();

  const second = createPage();
  const after = startOn(second);

  expect(after.log).toEqual(["state foreground/available"]);
  expect(after.entries).toEqual([]);
});

test("B-040 prerender activation enters foreground from a background baseline, with no duration", () => {
  const page = createPage();

  page.page.prerendering = true;

  const { log, entries, pulse } = startOn(page);

  expect(pulse.state.get().phase).toBe("background");

  page.page.prerendering = false;
  page.fire(page.document, "prerenderingchange");

  expect(log).toEqual([
    "state background/unavailable",
    "state foreground/available",
    "foreground #2",
  ]);
  expect(entries[0]?.observedAway).toBeNull();
});
