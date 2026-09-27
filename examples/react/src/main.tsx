import { browser } from "@priemskiyyy/pulse/browser";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createLifecycleLab } from "example-shared/lab/createLifecycleLab";
import { REQUEST_LATENCY, STALE_AFTER } from "example-shared/lab/constants/lab";
import { wait } from "example-shared/utils/wait";
import { Application } from "src/Application";
import { recordDocumentSignals } from "src/utils/recordDocumentSignals";
import "src/styles.css";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("The page has no #root element.");
}

// `?record` records raw signals from the first load; `?staleAfter=0` refreshes on every return.
const parameters = new URLSearchParams(window.location.search);

const lab = createLifecycleLab({
  adapter: browser(),
  staleAfter: Number(parameters.get("staleAfter") ?? STALE_AFTER),
  recording: parameters.has("record"),
  request: () => wait(REQUEST_LATENCY),
});

// A fresh document gets a fresh token; a back/forward cache restore keeps the old one.
const documentToken = crypto.randomUUID();

// Recording starts before Pulse, so the first raw signals are kept. The page owns both for its whole life.
recordDocumentSignals(lab.recordHost);
lab.start();

createRoot(root).render(
  <StrictMode>
    <Application lab={lab} documentToken={documentToken} />
  </StrictMode>,
);
