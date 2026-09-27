import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";

import { useLifecycle } from "src/react/useLifecycle";
import { createMockAdapter } from "src/testing/createMockAdapter";
import type { LifecycleSource } from "src/types/LifecycleSource";
import type { LifecycleState } from "src/types/LifecycleState";
import { Pulse } from "src/utils/Pulse";

const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "available",
};

const Label = ({ source }: { source: LifecycleSource }) => {
  const { phase, interaction } = useLifecycle(source);

  return createElement("span", null, `${phase}/${interaction}`);
};

test("R-005 R-010 R-012 a server render reads unknown per request and starts nothing", () => {
  const first = createMockAdapter({ initial: FOREGROUND });
  const second = createMockAdapter({ initial: FOREGROUND });

  const html = [first, second].map((mock) =>
    renderToString(
      createElement(Label, { source: new Pulse({ adapter: mock.adapter }) }),
    ),
  );

  expect(html).toEqual([
    "<span>unknown/unknown</span>",
    "<span>unknown/unknown</span>",
  ]);
  expect(
    first.stats().observationsStarted + second.stats().observationsStarted,
  ).toBe(0);
  expect("window" in globalThis).toBe(false);
});

test("R-006 R-011 a client that already knows its state still hydrates from unknown, then shows it", async () => {
  const html = renderToString(
    createElement(Label, {
      source: new Pulse({ adapter: createMockAdapter().adapter }),
    }),
  );

  const { window } = new JSDOM(`<!doctype html><div id="root">${html}</div>`);

  vi.stubGlobal("window", window);
  vi.stubGlobal("document", window.document);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });
  const onRecoverableError = vi.fn();
  const onForeground = vi.fn();
  const container = window.document.getElementById("root");

  pulse.on("foreground", onForeground);
  pulse.start();

  if (container === null) {
    throw new Error("The fixture has no root.");
  }

  await act(async () => {
    hydrateRoot(container, createElement(Label, { source: pulse }), {
      onRecoverableError,
    });
  });

  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.textContent).toBe("foreground/available");
  expect(onForeground).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
