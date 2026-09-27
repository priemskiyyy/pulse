import { expect, test } from "vitest";

import { PulseError } from "src/utils/PulseError";

test("an error Pulse creates carries its code, and names itself", () => {
  const error = new PulseError({
    code: "DISPOSED",
    message: "The Pulse was disposed.",
  });

  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({
    name: "PulseError",
    code: "DISPOSED",
    message: "The Pulse was disposed.",
  });
});

test("a cause is kept as it was thrown, and an error without one has no cause of its own", () => {
  const cause = "a string, not an Error";

  const withCause = new PulseError({
    code: "START_FAILED",
    message: "The adapter's setup failed.",
    cause,
  });

  const withoutCause = new PulseError({
    code: "INVALID_OPTIONS",
    message: "The options are not an object.",
  });

  expect(withCause.cause).toBe(cause);
  expect(Object.hasOwn(withoutCause, "cause")).toBe(false);
});
