import { PulseError } from "src/utils/PulseError";

export const sampleClock = (now: () => number) => {
  let timestamp: unknown;

  try {
    timestamp = now();
  } catch (error) {
    return {
      timestamp: null,
      error: new PulseError({
        code: "INVALID_CLOCK",
        message: "The clock threw.",
        cause: error,
      }),
    };
  }

  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return {
      timestamp: null,
      error: new PulseError({
        code: "INVALID_CLOCK",
        message:
          "The clock answered something other than finite epoch milliseconds.",
      }),
    };
  }

  return { timestamp, error: null };
};
