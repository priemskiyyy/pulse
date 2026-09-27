import { BACKGROUND_STATE } from "src/adapters/browser/utils/constants/states";
import type { LifecycleState } from "src/types/LifecycleState";

export const sampleDocument = (targetDocument: Document): LifecycleState => {
  // A browser without prerendering support reports nothing, which is no evidence of it.
  const prerendering =
    "prerendering" in targetDocument ? targetDocument.prerendering : false;

  if (prerendering === true) {
    return BACKGROUND_STATE;
  }

  const { visibilityState } = targetDocument;

  if (visibilityState === "hidden") {
    return BACKGROUND_STATE;
  }

  // Legacy values such as "prerender" are no evidence of foreground.
  const phase = visibilityState === "visible" ? "foreground" : "unknown";

  return {
    phase,
    interaction: targetDocument.hasFocus() ? "available" : "unavailable",
  };
};
