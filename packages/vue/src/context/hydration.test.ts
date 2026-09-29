import { afterEach, expect, test, vi } from "vitest";
import { nextTick } from "vue";
import { renderToString } from "vue/server-renderer";

import { createView } from "src/context/view.fixture";

afterEach(() => {
  document.body.replaceChildren();
});

test("R-006 hydration reads the server snapshot, then the state the client already knows", async () => {
  const warn = vi.spyOn(console, "warn");
  const error = vi.spyOn(console, "error");
  const html = await renderToString(createView().createApp());

  // The client already knows it is in the foreground, and still hydrates from the server's snapshot.
  const client = createView();

  client.pulse.start();

  const container = document.body.appendChild(document.createElement("div"));

  container.innerHTML = html;

  const app = client.createApp();

  app.mount(container);
  await nextTick();

  expect(warn.mock.calls).toEqual([]);
  expect(error.mock.calls).toEqual([]);
  expect(container.textContent).toBe("foreground/available");

  app.unmount();
});
