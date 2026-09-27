import type { PulseHost } from "src/types/internal/PulseHost";
import type { PulseErrorContext } from "src/types/PulseErrorContext";

// The core compiles without DOM or Node types, where no console is declared.
declare const console: { error?: unknown } | undefined;

const writeToConsole = (...values: unknown[]) => {
  try {
    if (typeof console === "undefined" || typeof console.error !== "function") {
      return;
    }

    console.error(...values);
  } catch {
    // A missing or throwing console must not break the delivery around it.
  }
};

export const reportError = (
  { onError }: PulseHost,
  error: unknown,
  context: PulseErrorContext,
) => {
  if (onError === null) {
    writeToConsole(`Pulse: ${context.origin} error`, error);

    return;
  }

  try {
    onError(error, context);
  } catch (failure) {
    // onError never hears about its own failure, so a throwing reporter cannot loop.
    writeToConsole("Pulse: onError threw", failure, error);
  }
};
