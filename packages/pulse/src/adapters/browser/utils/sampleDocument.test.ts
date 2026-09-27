import { JSDOM } from "jsdom";
import { expect, test, vi } from "vitest";

import { sampleDocument } from "src/adapters/browser/utils/sampleDocument";

const createDocument = (overrides: PropertyDescriptorMap = {}) => {
  const { document } = new JSDOM("<!doctype html>", {
    pretendToBeVisual: true,
  }).window;

  Object.defineProperties(document, {
    visibilityState: { configurable: true, get: () => "visible" },
    hasFocus: { configurable: true, value: () => true },
    ...overrides,
  });

  return document;
};

test("B-006 B-007 a visible document is foreground, with its focus as interaction", () => {
  expect(sampleDocument(createDocument())).toEqual({
    phase: "foreground",
    interaction: "available",
  });

  expect(
    sampleDocument(createDocument({ hasFocus: { value: () => false } })),
  ).toEqual({ phase: "foreground", interaction: "unavailable" });
});

test("B-008 B-013 a hidden document is background without reading focus, whatever focus says", () => {
  const hasFocus = vi.fn(() => true);

  const hidden = createDocument({
    visibilityState: { get: () => "hidden" },
    hasFocus: { value: hasFocus },
  });

  expect(sampleDocument(hidden)).toEqual({
    phase: "background",
    interaction: "unavailable",
  });
  expect(hasFocus).not.toHaveBeenCalled();
});

test("B-009 B-012 a missing or unrecognized visibility is an unknown phase that keeps focus", () => {
  for (const visibility of [undefined, "prerender", "unloaded"]) {
    const document = createDocument({
      visibilityState: { get: () => visibility },
    });

    expect(sampleDocument(document)).toEqual({
      phase: "unknown",
      interaction: "available",
    });
  }
});

test("B-039 a prerendering document is background even if the rest looks foreground", () => {
  const prerendering = createDocument({ prerendering: { get: () => true } });

  expect(sampleDocument(prerendering)).toEqual({
    phase: "background",
    interaction: "unavailable",
  });
});

test("B-041 an absent prerender probe does not erase valid visibility", () => {
  const absent = createDocument();

  expect("prerendering" in absent).toBe(false);
  expect(sampleDocument(absent)).toEqual({
    phase: "foreground",
    interaction: "available",
  });
});
