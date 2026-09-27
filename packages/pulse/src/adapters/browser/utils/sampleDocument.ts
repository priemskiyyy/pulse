import type { LifecycleState } from "src/types/LifecycleState";
import { LIFECYCLE_STATES } from "src/utils/constants/states";

export const sampleDocument = (targetDocument: Document): LifecycleState => {
  // A browser without prerendering support reports nothing, which is no evidence of it.
  const prerendering =
    "prerendering" in targetDocument ? targetDocument.prerendering : false;

  if (prerendering === true) {
    return LIFECYCLE_STATES.background.unavailable;
  }

  const { visibilityState } = targetDocument;

  if (visibilityState === "hidden") {
    return LIFECYCLE_STATES.background.unavailable;
  }

  // Legacy values such as "prerender" are no evidence of foreground.
  const phase = visibilityState === "visible" ? "foreground" : "unknown";

  return {
    phase,
    interaction: targetDocument.hasFocus() ? "available" : "unavailable",
  };
};
