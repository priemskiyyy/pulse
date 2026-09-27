import type { LifecycleState } from "@priemskiyyy/pulse";
import { createMockAdapter, createTestClock } from "@priemskiyyy/pulse/testing";
import { expect, test } from "vitest";

import { formatTimelineEntry } from "example-shared/formatting/formatTimelineEntry";
import { createLifecycleLab } from "example-shared/lab/createLifecycleLab";

const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "available",
};

const BACKGROUND: LifecycleState = {
  phase: "background",
  interaction: "unavailable",
};

const setup = ({ recording = false } = {}) => {
  const clock = createTestClock(1_000);
  const mock = createMockAdapter({ initial: FOREGROUND });

  const requests: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  const lab = createLifecycleLab({
    adapter: mock.adapter,
    staleAfter: 100,
    recording,
    now: clock.now,
    request: () =>
      new Promise<void>((resolve, reject) => {
        requests.push({ resolve, reject });
      }),
  });

  lab.start();

  const describeTimeline = () =>
    lab.timeline.getSnapshot().map(formatTimelineEntry).reverse();

  return { clock, mock, lab, requests, describeTimeline };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test("a foreground transition refreshes only stale data", async () => {
  const { clock, mock, lab, requests } = setup();

  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);
  expect(requests).toHaveLength(0);

  clock.advance(100);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);
  expect(lab.refresh.get().status).toEqual({ state: "refreshing" });

  requests[0]?.resolve();
  await settle();
  expect(lab.refresh.get()).toEqual({
    refreshes: 1,
    status: { state: "refreshed", at: 1_100 },
  });
});

test("a foreground transition during a refresh joins it", () => {
  const { clock, mock, requests } = setup();

  clock.advance(100);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);

  expect(requests).toHaveLength(1);
});

test("a failed refresh is shown and keeps the old data", async () => {
  const { clock, mock, lab, requests } = setup();

  lab.failNextRefresh.set(true);
  clock.advance(100);
  mock.emit(BACKGROUND);
  mock.emit(FOREGROUND);
  requests[0]?.resolve();
  await settle();

  expect(lab.refresh.get()).toEqual({
    refreshes: 0,
    status: { state: "failed", message: "The simulated request failed." },
  });
  expect(lab.failNextRefresh.get()).toBe(false);
});

// The commit diagnostic follows its listeners, so a transition reads before its commit.
test("the timeline reads the diagnostics and transitions in order", () => {
  const { mock, describeTimeline } = setup();

  mock.emit(BACKGROUND);

  expect(describeTimeline()).toEqual([
    "Started observing through mock",
    "#1 unknown / unknown -> foreground / available",
    "Background",
    "#2 foreground / available -> background / unavailable",
  ]);
});

test("host signals are recorded only while recording", () => {
  const { lab, describeTimeline } = setup();

  lab.recordHost({ name: "visibilitychange", detail: "hidden" });
  lab.recording.set(true);
  lab.recordHost({ name: "pageshow", detail: "persisted=false" });

  expect(describeTimeline().slice(2)).toEqual(["pageshow persisted=false"]);
});

test("stopping the observation leaves the simulation running", () => {
  const { mock, lab } = setup();

  lab.stopObserving();
  mock.emit(BACKGROUND);
  lab.simulate(BACKGROUND);

  expect(lab.observing.get()).toBe(false);
  expect(lab.pulse.state.get()).toEqual(FOREGROUND);
  expect(lab.simulation.state.get()).toEqual(BACKGROUND);
});
