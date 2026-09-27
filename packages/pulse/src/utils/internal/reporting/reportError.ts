import type { PulseHost } from "src/types/internal/PulseHost";
import type { PulseErrorContext } from "src/types/PulseErrorContext";
import { reportToConsole } from "src/utils/internal/reporting/reportToConsole";

export const reportError = (
  { onError }: PulseHost,
  error: unknown,
  context: PulseErrorContext,
) => {
  if (onError === null) {
    reportToConsole(`Pulse: ${context.origin} error`, error);

    return;
  }

  try {
    onError(error, context);
  } catch (failure) {
    // onError never hears about its own failure, so a throwing reporter cannot loop.
    reportToConsole("Pulse: onError threw", failure, error);
  }
};
