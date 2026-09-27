import type { LifecycleState } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createLifecycleLab } from "example-shared/lab/createLifecycleLab";
import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { Application } from "src/Application";

class IntersectionObserverStub {
  observe() {}

  disconnect() {}
}

const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "available",
};

const BACKGROUND: LifecycleState = {
  phase: "background",
  interaction: "unavailable",
};

const labs: LifecycleLab[] = [];

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
});

afterEach(() => {
  cleanup();

  for (const lab of labs.splice(0)) {
    lab.dispose();
  }

  vi.unstubAllGlobals();
});

const renderApplication = () => {
  const mock = createMockAdapter({ initial: FOREGROUND });

  const lab = createLifecycleLab({
    adapter: mock.adapter,
    staleAfter: 0,
    recording: false,
    request: () => Promise.resolve(),
  });

  labs.push(lab);
  lab.start();
  render(<Application lab={lab} documentToken="token-1" />);

  return { mock, lab };
};

const fact = (term: string) => screen.getByLabelText(term);

const panel = (name: string) => screen.getByRole("region", { name });

test("the state panel shows the observed phase and interaction", () => {
  const { mock } = renderApplication();

  expect(fact("Phase").textContent).toBe("foreground");
  expect(fact("Interaction").textContent).toBe("available");

  act(() => mock.emit(BACKGROUND));

  expect(fact("Phase").textContent).toBe("background");
  expect(fact("Interaction").textContent).toBe("unavailable");
});

test("a return refreshes stale data and shows a failure", async () => {
  const { mock } = renderApplication();

  act(() => mock.emit(BACKGROUND));
  await act(async () => mock.emit(FOREGROUND));
  expect(fact("Refreshes").textContent).toBe("1");

  fireEvent.click(
    screen.getByRole("button", { name: "Fail the next refresh" }),
  );
  act(() => mock.emit(BACKGROUND));
  await act(async () => mock.emit(FOREGROUND));

  expect(fact("Refreshes").textContent).toBe("1");
  expect(fact("Last refresh").textContent).toBe(
    "Failed: The simulated request failed.",
  );
});

test("dispose ends the observation for good", () => {
  const { mock } = renderApplication();

  fireEvent.click(screen.getByRole("button", { name: "Dispose" }));
  act(() => mock.emit(BACKGROUND));

  expect(fact("Observation").textContent).toBe("disposed");
  expect(fact("Phase").textContent).toBe("foreground");
  expect(screen.getByRole("button", { name: "Dispose" })).toHaveProperty(
    "disabled",
    true,
  );
});

test("the timeline lists transitions newest first", () => {
  const { mock } = renderApplication();

  act(() => mock.emit(BACKGROUND));

  const entries = within(panel("Timeline")).getAllByRole("listitem");

  expect(entries[0]?.textContent).toContain(
    "#2 foreground / available -> background / unavailable",
  );
  expect(entries[1]?.textContent).toContain("Background");
});

test("the simulation moves without touching the real state", () => {
  renderApplication();

  fireEvent.click(screen.getByRole("button", { name: "Background" }));

  expect(fact("Simulated phase").textContent).toBe("background");
  expect(fact("Phase").textContent).toBe("foreground");
});
