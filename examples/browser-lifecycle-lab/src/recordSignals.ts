export type Signal = {
  type: string;
  at: number;
  visibilityState: DocumentVisibilityState;
  hasFocus: boolean;
  /** `pageshow` and `pagehide` only: whether the page enters or leaves the back/forward cache. */
  persisted: boolean | null;
};

const SOURCES: Array<[EventTarget, string]> = [
  [document, "visibilitychange"],
  [document, "freeze"],
  [document, "resume"],
  [window, "focus"],
  [window, "blur"],
  [window, "pagehide"],
  [window, "pageshow"],
];

// Raw host events, recorded next to Pulse for comparison. This is lab code, not a Pulse API.
export const recordSignals = (onSignal: (signal: Signal) => void) => {
  const record = (event: Event) => {
    // Focus moving between controls also reaches the window while capturing.
    if (event.target instanceof Element) {
      return;
    }

    onSignal({
      type: event.type,
      at: Date.now(),
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus(),
      persisted: event instanceof PageTransitionEvent ? event.persisted : null,
    });
  };

  for (const [target, type] of SOURCES) {
    target.addEventListener(type, record, true);
  }

  return () => {
    for (const [target, type] of SOURCES) {
      target.removeEventListener(type, record, true);
    }
  };
};
