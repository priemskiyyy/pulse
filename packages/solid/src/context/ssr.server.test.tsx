import { renderToString } from "solid-js/web";
import { expect, test } from "vitest";

import { STATUS_MARKUP } from "src/context/serverMarkup.fixture";
import { createStatus } from "src/context/status.fixture";
import { StatusView } from "src/context/View.fixture";

test("R-005 R-021 a server render reads unknown and starts nothing", () => {
  expect(typeof window).toBe("undefined");

  const { mock, pulse } = createStatus();

  expect(renderToString(() => <StatusView pulse={pulse} />)).toBe(
    STATUS_MARKUP,
  );
  expect(mock.stats().observationsStarted).toBe(0);
});

test("R-005 a server render reads unknown whatever the Pulse knows", () => {
  const { pulse } = createStatus();

  pulse.start();

  expect(renderToString(() => <StatusView pulse={pulse} />)).toBe(
    STATUS_MARKUP,
  );
});
