import { hydrate } from "solid-js/web";
import { afterEach, expect, test, vi } from "vitest";

import { STATUS_MARKUP } from "src/context/serverMarkup.fixture";
import { createStatus } from "src/context/status.fixture";
import { StatusView } from "src/context/View.fixture";

afterEach(() => {
  document.body.replaceChildren();
  Reflect.deleteProperty(globalThis, "_$HY");
});

test("R-006 hydration keeps the server's node, then shows the state the client already knows", () => {
  const warn = vi.spyOn(console, "warn");
  const error = vi.spyOn(console, "error");

  // The client already knows it is in the foreground, and still hydrates from the server's snapshot.
  const { pulse } = createStatus();

  pulse.start();

  const target = document.body.appendChild(document.createElement("div"));

  target.innerHTML = STATUS_MARKUP;

  const rendered = target.firstChild;

  // Solid hydrates through the global that the page's hydration script creates, so the test creates it.
  Object.assign(globalThis, {
    _$HY: { events: [], completed: new WeakSet(), r: {}, fe: () => {} },
  });

  const dispose = hydrate(() => <StatusView pulse={pulse} />, target);

  expect(target.childNodes).toHaveLength(1);
  expect(target.firstChild).toBe(rendered);
  expect(warn.mock.calls).toEqual([]);
  expect(error.mock.calls).toEqual([]);
  expect(target.textContent).toBe("foreground/available");

  dispose();
});
