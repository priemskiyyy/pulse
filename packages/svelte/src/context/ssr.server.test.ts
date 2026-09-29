import { render } from "svelte/server";
import { expect, test } from "vitest";

import { STATUS_MARKUP } from "./serverMarkup.fixture.js";
import { createStatus } from "./status.fixture.js";
import StatusHarness from "./StatusHarness.fixture.svelte";

test("R-005 R-021 a server render reads unknown and starts nothing", () => {
  expect(typeof window).toBe("undefined");

  const { mock, pulse } = createStatus();

  expect(render(StatusHarness, { props: { pulse } }).body).toBe(STATUS_MARKUP);
  expect(mock.stats().observationsStarted).toBe(0);
});

test("R-005 a server render reads unknown whatever the Pulse knows", () => {
  const { pulse } = createStatus();

  pulse.start();

  expect(render(StatusHarness, { props: { pulse } }).body).toBe(STATUS_MARKUP);
});
