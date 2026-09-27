import type { InteractionState } from "src/types/InteractionState";
import type { LifecyclePhase } from "src/types/LifecyclePhase";
import type { LifecycleState } from "src/types/LifecycleState";
import { LIFECYCLE_STATES } from "src/utils/constants/states";

type DocumentSample = { state: LifecycleState; errors: unknown[] };

// A browser without prerendering support reports nothing, which is no evidence of it.
const readPrerendering = (targetDocument: Document, errors: unknown[]) => {
  if (!("prerendering" in targetDocument)) {
    return false;
  }

  try {
    return targetDocument.prerendering === true;
  } catch (error) {
    // A throwing optional property must not erase the visibility reading.
    errors.push(error);

    return false;
  }
};

const readPhase = (
  targetDocument: Document,
  errors: unknown[],
): LifecyclePhase => {
  let visibilityState: DocumentVisibilityState;

  try {
    ({ visibilityState } = targetDocument);
  } catch (error) {
    errors.push(error);

    return "unknown";
  }

  if (visibilityState === "hidden") {
    return "background";
  }

  // Legacy values such as "prerender" are no evidence of foreground.
  if (visibilityState !== "visible") {
    return "unknown";
  }

  return "foreground";
};

const readInteraction = (
  targetDocument: Document,
  errors: unknown[],
): InteractionState => {
  try {
    return targetDocument.hasFocus() ? "available" : "unavailable";
  } catch (error) {
    errors.push(error);

    return "unknown";
  }
};

/** Samples the document; a throwing getter leaves only its own axis unknown and is returned for reporting. */
export const sampleDocument = (targetDocument: Document): DocumentSample => {
  const errors: unknown[] = [];

  if (readPrerendering(targetDocument, errors)) {
    return { state: LIFECYCLE_STATES.background.unavailable, errors };
  }

  const phase = readPhase(targetDocument, errors);

  // Background needs no focus reading: its interaction is always unavailable.
  if (phase === "background") {
    return { state: LIFECYCLE_STATES.background.unavailable, errors };
  }

  const interaction = readInteraction(targetDocument, errors);

  return { state: LIFECYCLE_STATES[phase][interaction], errors };
};
