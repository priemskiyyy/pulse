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

const failing = (message: string) => ({
  configurable: true,
  get: () => {
    throw new Error(message);
  },
});

test("B-006 B-007 a visible document is foreground, with its focus as interaction", () => {
  expect(sampleDocument(createDocument())).toEqual({
    state: { phase: "foreground", interaction: "available" },
    failures: [],
  });

  expect(
    sampleDocument(createDocument({ hasFocus: { value: () => false } })).state,
  ).toEqual({ phase: "foreground", interaction: "unavailable" });
});

test("B-008 B-013 a hidden document is background without reading focus, whatever focus says", () => {
  const hasFocus = vi.fn(() => true);

  const hidden = createDocument({
    visibilityState: { get: () => "hidden" },
    hasFocus: { value: hasFocus },
  });

  expect(sampleDocument(hidden).state).toEqual({
    phase: "background",
    interaction: "unavailable",
  });
  expect(hasFocus).not.toHaveBeenCalled();
});

test("B-009 a missing visibility is an unknown phase that keeps its focus evidence", () => {
  const withoutVisibility = createDocument({
    visibilityState: { get: () => undefined },
  });

  expect(sampleDocument(withoutVisibility).state).toEqual({
    phase: "unknown",
    interaction: "available",
  });
});

test("B-010 a missing focus getter is foreground with unknown interaction, never available", () => {
  const withoutFocus = createDocument({ hasFocus: { value: undefined } });

  expect(sampleDocument(withoutFocus)).toEqual({
    state: { phase: "foreground", interaction: "unknown" },
    failures: [],
  });
});

test("B-011 a throwing focus getter leaves only interaction unknown, and is kept to report", () => {
  const failure = new Error("hasFocus failed");

  const throwing = createDocument({
    hasFocus: {
      value: () => {
        throw failure;
      },
    },
  });

  expect(sampleDocument(throwing)).toEqual({
    state: { phase: "foreground", interaction: "unknown" },
    failures: [failure],
  });
});

test("B-012 an unrecognized visibility never defaults to foreground", () => {
  for (const visibility of ["prerender", "unloaded", "", 1]) {
    const unrecognized = createDocument({
      visibilityState: { get: () => visibility },
    });

    expect(sampleDocument(unrecognized).state.phase).toBe("unknown");
  }
});

test("a throwing visibility getter is an unknown phase, and is kept to report", () => {
  const sample = sampleDocument(
    createDocument({ visibilityState: failing("visibility failed") }),
  );

  expect(sample.state).toEqual({ phase: "unknown", interaction: "available" });
  expect(sample.failures).toEqual([new Error("visibility failed")]);
});

test("B-039 a prerendering document is background even if the rest looks foreground", () => {
  const prerendering = createDocument({ prerendering: { get: () => true } });

  expect(sampleDocument(prerendering).state).toEqual({
    phase: "background",
    interaction: "unavailable",
  });
});

test("B-041 an absent or throwing prerender probe does not erase valid visibility", () => {
  const absent = createDocument();

  const throwing = createDocument({
    prerendering: failing("prerendering failed"),
  });

  expect("prerendering" in absent).toBe(false);
  expect(sampleDocument(absent).state).toEqual({
    phase: "foreground",
    interaction: "available",
  });
  expect(sampleDocument(throwing)).toEqual({
    state: { phase: "foreground", interaction: "available" },
    failures: [new Error("prerendering failed")],
  });
});
