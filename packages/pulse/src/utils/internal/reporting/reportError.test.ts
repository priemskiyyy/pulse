import { expect, test, vi } from "vitest";

import type { PulseHost } from "src/types/internal/PulseHost";
import type { PulseErrorContext } from "src/types/PulseErrorContext";
import { reportError } from "src/utils/internal/reporting/reportError";

const context: PulseErrorContext = Object.freeze({
  origin: "state-listener",
  adapter: { name: "test" },
  sequence: 3,
});

const createHost = (onError: PulseHost["onError"]): PulseHost => ({
  adapter: { name: "test" },
  now: () => 0,
  onError,
  onDiagnostic: null,
});

test("an error goes to onError with its frozen context, and nowhere else", () => {
  const onError = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const failure = "not an Error";

  reportError(createHost(onError), failure, context);

  expect(onError.mock.calls).toEqual([[failure, context]]);
  expect(consoleError).not.toHaveBeenCalled();
});

test("without onError, the console receives the error and its origin", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const failure = new Error("listener failed");

  reportError(createHost(null), failure, context);

  expect(consoleError.mock.calls).toEqual([
    ["Pulse: state-listener error", failure],
  ]);
});

test("C-066 a throwing onError is logged with the original, and never called again for it", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const failure = new Error("listener failed");
  const reporterFailure = new Error("reporter failed");

  const onError = vi.fn(() => {
    throw reporterFailure;
  });

  expect(() =>
    reportError(createHost(onError), failure, context),
  ).not.toThrow();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(consoleError.mock.calls).toEqual([
    ["Pulse: onError threw", reporterFailure, failure],
  ]);
});

test("C-066 a throwing console cannot throw into the caller", () => {
  vi.spyOn(console, "error").mockImplementation(() => {
    throw new Error("console failed");
  });

  expect(() =>
    reportError(createHost(null), new Error("listener failed"), context),
  ).not.toThrow();
});
