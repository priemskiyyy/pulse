import type { HostSignal } from "example-shared/lab/types/HostSignal";

const describeDocument = () =>
  `visibility=${document.visibilityState} focus=${document.hasFocus()}`;

const describeEvent = (event: Event) => {
  if (event instanceof PageTransitionEvent) {
    return `persisted=${event.persisted} ${describeDocument()}`;
  }

  return describeDocument();
};

// The raw browser events Pulse reads, recorded beside it for comparison.
export const recordDocumentSignals = (
  onSignal: (signal: HostSignal) => void,
) => {
  const record = (event: Event) => {
    // Focus moving between controls also reaches the window while capturing.
    if (event.target instanceof Element) {
      return;
    }

    onSignal({ name: event.type, detail: describeEvent(event) });
  };

  const sources: Array<[EventTarget, string]> = [
    [document, "visibilitychange"],
    [document, "freeze"],
    [document, "resume"],
    [window, "focus"],
    [window, "blur"],
    [window, "pagehide"],
    [window, "pageshow"],
  ];

  for (const [target, type] of sources) {
    target.addEventListener(type, record, true);
  }

  return () => {
    for (const [target, type] of sources) {
      target.removeEventListener(type, record, true);
    }
  };
};
