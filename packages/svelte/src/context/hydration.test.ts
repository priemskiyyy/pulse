import { flushSync, hydrate, unmount } from "svelte";
import { afterEach, expect, test, vi } from "vitest";

import { STATUS_MARKUP } from "./serverMarkup.fixture.js";
import { createStatus } from "./status.fixture.js";
import StatusHarness from "./StatusHarness.fixture.svelte";

afterEach(() => {
  document.body.replaceChildren();
});

test("R-006 hydration reads the server snapshot, then the state the client already knows", () => {
  const warn = vi.spyOn(console, "warn");
  const error = vi.spyOn(console, "error");

  // The client already knows it is in the foreground, and still hydrates from the server's snapshot.
  const { pulse } = createStatus();

  pulse.start();

  const target = document.body.appendChild(document.createElement("div"));

  target.innerHTML = STATUS_MARKUP;

  const app = hydrate(StatusHarness, { target, props: { pulse } });

  flushSync();

  expect(warn.mock.calls).toEqual([]);
  expect(error.mock.calls).toEqual([]);
  expect(target.textContent).toBe("foreground/available");

  unmount(app);
});
