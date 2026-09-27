import { PulseError } from "src/utils/PulseError";

export const sampleClock = (now: () => number) => {
  let timestamp: number;

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

  // The type allows NaN and the infinities; an epoch time is finite.
  if (!Number.isFinite(timestamp)) {
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
