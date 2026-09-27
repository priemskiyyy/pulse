import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";
import { PulseError } from "src/utils/PulseError";

// The value is never described: it can hold anything, of any size.
const createInvalid = (message: string, cause?: unknown) => ({
  state: UNKNOWN_LIFECYCLE_STATE,
  error: new PulseError({ code: "INVALID_OBSERVATION", message, cause }),
});

export const readObservation = (value: unknown) => {
  let fields: { phase: unknown; interaction: unknown };

  try {
    if (
      typeof value !== "object" ||
      value === null ||
      !("phase" in value) ||
      !("interaction" in value)
    ) {
      return createInvalid(
        "The adapter's snapshot is not an object with a phase and an interaction.",
      );
    }

    fields = { phase: value.phase, interaction: value.interaction };
  } catch (error) {
    return createInvalid("Reading the adapter's snapshot threw.", error);
  }

  const { phase, interaction } = fields;

  const knownPhase =
    phase === "foreground" || phase === "background" || phase === "unknown";

  const knownInteraction =
    interaction === "available" ||
    interaction === "unavailable" ||
    interaction === "unknown";

  if (!knownPhase || !knownInteraction) {
    return createInvalid(
      "The adapter's snapshot has a phase or an interaction outside the contract.",
    );
  }

  const state = LIFECYCLE_STATES[phase][interaction];

  if (state === null) {
    return createInvalid(
      "The adapter reported background with an interaction other than unavailable.",
    );
  }

  return { state, error: null };
};
