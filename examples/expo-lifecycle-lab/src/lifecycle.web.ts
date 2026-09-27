import { Pulse } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";

import { recordCommit, trace } from "src/trace";

// The web build observes the document, not React Native Web's AppState.
export const pulse = new Pulse({
  adapter: browser(),
  onDiagnostic: recordCommit,
});

export const runtime = `web, ${navigator.userAgent}`;

const recordDocument = () =>
  trace.push(
    "raw",
    `visibility=${document.visibilityState} focus=${document.hasFocus()}`,
  );

export const recordRawSignals = () => {
  document.addEventListener("visibilitychange", recordDocument);
  window.addEventListener("focus", recordDocument);
  window.addEventListener("blur", recordDocument);
  recordDocument();

  return () => {
    document.removeEventListener("visibilitychange", recordDocument);
    window.removeEventListener("focus", recordDocument);
    window.removeEventListener("blur", recordDocument);
  };
};
