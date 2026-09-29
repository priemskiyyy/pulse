import { expect, test } from "vitest";
import { renderToString } from "vue/server-renderer";

import { createView } from "src/context/view.fixture";

const MARKUP = "<!--[--><span>unknown/unknown</span><!--]-->";

test("R-005 R-021 a server render reads unknown and starts nothing", async () => {
  expect(typeof window).toBe("undefined");

  const { mock, createApp } = createView();

  expect(await renderToString(createApp())).toBe(MARKUP);
  expect(mock.stats().observationsStarted).toBe(0);
});

test("R-005 a server render reads unknown whatever the Pulse knows", async () => {
  const { pulse, createApp } = createView();

  pulse.start();

  expect(await renderToString(createApp())).toBe(MARKUP);
});
