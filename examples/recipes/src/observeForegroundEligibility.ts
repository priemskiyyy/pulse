import type { LifecycleSource } from "@priemskiyyy/pulse";

/**
 * Tells `apply` whether work is eligible now, and again whenever that changes:
 * foreground is eligible, background and unknown are not. It reads the current
 * state at once, so a service that attaches late needs no replayed event, and
 * it never starts the source.
 *
 * @example
 * ```ts
 * const stop = observeForegroundEligibility(pulse, (eligible) => {
 *   poller.setEnabled(eligible);
 * });
 * ```
 */
export const observeForegroundEligibility = (
  source: LifecycleSource,
  apply: (eligible: boolean) => void,
) => {
  let closed = false;
  let previous: boolean | null = null;

  const handleChange = () => {
    if (closed) {
      return;
    }

    const eligible = source.state.get().phase === "foreground";

    if (eligible === previous) {
      return;
    }

    // Recorded before calling out, so a reentrant change compares with it.
    previous = eligible;
    apply(eligible);
  };

  const unsubscribe = source.state.subscribe(handleChange);

  try {
    handleChange();
  } catch (error) {
    closed = true;
    unsubscribe();
    throw error;
  }

  return () => {
    if (closed) {
      return;
    }

    closed = true;
    unsubscribe();
  };
};
