import { browser } from "@priemskiyyy/pulse/browser";

import { REQUEST_LATENCY, STALE_AFTER } from "example-shared/lab/constants/lab";
import { createLifecycleLab } from "example-shared/lab/createLifecycleLab";
import { wait } from "example-shared/utils/wait";

const describeDocument = () =>
  `visibility=${document.visibilityState} focus=${document.hasFocus()}`;

/** The web build observes the document, not React Native Web's AppState. */
export const startLab = () => {
  const lab = createLifecycleLab({
    adapter: browser(),
    staleAfter: STALE_AFTER,
    recording: true,
    request: () => wait(REQUEST_LATENCY),
  });

  const record = (event: Event) => {
    // Focus moving between controls also reaches the window while capturing.
    if (event.target instanceof Element) {
      return;
    }

    lab.recordHost({ name: event.type, detail: describeDocument() });
  };

  document.addEventListener("visibilitychange", record, true);
  window.addEventListener("focus", record, true);
  window.addEventListener("blur", record, true);
  lab.start();

  return { lab, runtime: `web, ${navigator.userAgent}` };
};
