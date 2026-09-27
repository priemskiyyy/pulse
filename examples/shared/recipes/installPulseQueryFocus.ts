import type { LifecycleSource } from "@priemskiyyy/pulse";
import type { FocusManager } from "@tanstack/query-core";

import { observeForegroundEligibility } from "example-shared/recipes/observeForegroundEligibility";

/**
 * Drives TanStack Query's focus from Pulse's phase: foreground is focused,
 * background and unknown are not. Install it once, at bootstrap; a later
 * install replaces it, and nothing restores the listener it replaced.
 *
 * @example
 * ```ts
 * import { focusManager } from "@tanstack/query-core";
 *
 * installPulseQueryFocus(pulse, focusManager);
 * pulse.start();
 * ```
 */
export const installPulseQueryFocus = (
  source: LifecycleSource,
  manager: Pick<FocusManager, "setEventListener">,
) => {
  manager.setEventListener((setFocused) =>
    observeForegroundEligibility(source, setFocused),
  );
};
