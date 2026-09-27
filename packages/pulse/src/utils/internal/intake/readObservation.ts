import type { InteractionState } from "src/types/InteractionState";
import type { LifecyclePhase } from "src/types/LifecyclePhase";
import {
  LIFECYCLE_STATES,
  UNKNOWN_LIFECYCLE_STATE,
} from "src/utils/constants/states";
import { PulseError } from "src/utils/PulseError";

const isLifecyclePhase = (value: unknown): value is LifecyclePhase =>
  value === "foreground" || value === "background" || value === "unknown";

const isInteractionState = (value: unknown): value is InteractionState =>
  value === "available" || value === "unavailable" || value === "unknown";

// The value is never described: it can hold anything, of any size.
const createInvalid = (message: string, cause?: unknown) => ({
  state: UNKNOWN_LIFECYCLE_STATE,
  error: new PulseError({ code: "INVALID_OBSERVATION", message, cause }),
});

const readFields = (value: unknown) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  if (!("phase" in value) || !("interaction" in value)) {
    return null;
  }

  return { phase: value.phase, interaction: value.interaction };
};

export const readObservation = (value: unknown) => {
  let fields: { phase: unknown; interaction: unknown } | null;

  try {
    fields = readFields(value);
  } catch (error) {
    return createInvalid("Reading the adapter's snapshot threw.", error);
  }

  if (fields === null) {
    return createInvalid(
      "The adapter's snapshot is not an object with a phase and an interaction.",
    );
  }

  const { phase, interaction } = fields;

  if (!isLifecyclePhase(phase) || !isInteractionState(interaction)) {
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
