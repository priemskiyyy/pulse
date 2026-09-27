import { BACKGROUND_STATE } from "src/adapters/browser/utils/constants/states";
import type { LifecycleState } from "src/types/LifecycleState";

// Every getter is optional or may throw; a failure leaves only its own axis unknown.
export const sampleDocument = (
  targetDocument: Document,
): { state: LifecycleState; failures: unknown[] } => {
  const failures: unknown[] = [];

  try {
    if (
      "prerendering" in targetDocument &&
      targetDocument.prerendering === true
    ) {
      return { state: BACKGROUND_STATE, failures };
    }
  } catch (error) {
    failures.push(error);
  }

  let visibility: unknown = null;

  try {
    visibility = targetDocument.visibilityState;
  } catch (error) {
    failures.push(error);
  }

  if (visibility === "hidden") {
    return { state: BACKGROUND_STATE, failures };
  }

  const phase = visibility === "visible" ? "foreground" : "unknown";

  try {
    const focused: unknown =
      typeof targetDocument.hasFocus === "function"
        ? targetDocument.hasFocus()
        : null;

    if (typeof focused === "boolean") {
      const interaction = focused ? "available" : "unavailable";

      return { state: { phase, interaction }, failures };
    }
  } catch (error) {
    failures.push(error);
  }

  return { state: { phase, interaction: "unknown" }, failures };
};
