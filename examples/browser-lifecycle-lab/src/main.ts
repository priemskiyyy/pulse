import { Pulse } from "@priemskiyyy/pulse";
import type { LifecycleState, PulseDiagnostic } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";

import { createRefreshCounter } from "src/createRefreshCounter";
import { findElement } from "src/findElement";
import { recordSignals } from "src/recordSignals";
import type { Signal } from "src/recordSignals";

type Commit = Extract<PulseDiagnostic, { type: "commit" }>;

const TRACE_LIMIT = 100;

const parameters = new URLSearchParams(location.search);
// A fresh document gets a fresh token; a back/forward cache restore keeps the old one.
const documentToken = crypto.randomUUID();
const commits: Commit[] = [];
const signals: Signal[] = [];
let observation: "running" | "disposed" = "running";
let stopRecording: (() => void) | null = null;

const pushBounded = <TEntry>(entries: TEntry[], entry: TEntry) => {
  entries.push(entry);

  if (entries.length > TRACE_LIMIT) {
    entries.shift();
  }
};

const failNext = findElement("fail-next", HTMLInputElement);
const record = findElement("record", HTMLInputElement);

const refreshCounter = createRefreshCounter({
  staleAfter: Number(parameters.get("staleAfter") ?? 30_000),
  load: () =>
    new Promise((resolve, reject) => {
      const fail = failNext.checked;

      failNext.checked = false;
      setTimeout(() => {
        if (fail) {
          reject(new Error("The simulated request failed."));

          return;
        }

        resolve();
      }, 100);
    }),
  onChange: () => render(),
});

const pulse = new Pulse({
  adapter: browser(),
  onDiagnostic: (diagnostic) => {
    if (diagnostic.type !== "commit") {
      return;
    }

    pushBounded(commits, diagnostic);
  },
});

const mock = createMockAdapter();
const simulation = new Pulse({ adapter: mock.adapter });

const describe = ({ phase, interaction }: LifecycleState) =>
  `${phase} / ${interaction}`;

const showValue = (testId: string, value: string) => {
  const element = findElement(testId, HTMLElement);

  element.textContent = value;
  element.classList.toggle("unknown", value.includes("unknown"));
};

const showList = (testId: string, lines: string[]) => {
  const list = findElement(testId, HTMLOListElement);

  list.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");

      item.textContent = line;

      return item;
    }),
  );
};

const render = () => {
  const { phase, interaction } = pulse.state.get();
  const lastError = refreshCounter.getLastError();

  showValue("phase", phase);
  showValue("interaction", interaction);
  showValue("token", documentToken);
  showValue("status", observation);
  showValue("refreshes", String(refreshCounter.getRefreshes()));
  showValue(
    "refresh-error",
    lastError instanceof Error ? lastError.message : "none",
  );
  showValue("simulation-state", describe(simulation.state.get()));
  showList(
    "commits",
    commits.map(
      ({ sequence, from, to, transition }) =>
        `#${sequence} ${describe(from)} -> ${describe(to)}${transition === null ? "" : ` (${transition})`}`,
    ),
  );
  showList(
    "signals",
    signals.map(
      ({ type, visibilityState, hasFocus, persisted }) =>
        `${type} visibility=${visibilityState} focus=${hasFocus}${persisted === null ? "" : ` persisted=${persisted}`}`,
    ),
  );
};

const startRecording = () => {
  stopRecording = recordSignals((signal) => {
    pushBounded(signals, signal);
    render();
  });
};

const exportTrace = () => {
  const trace = {
    documentToken,
    userAgent: navigator.userAgent,
    exportedAt: new Date().toISOString(),
    commits,
    signals,
  };

  const link = document.createElement("a");

  link.href = URL.createObjectURL(
    new Blob([JSON.stringify(trace, null, 2)], { type: "application/json" }),
  );
  link.download = "pulse-trace.json";
  link.click();
  URL.revokeObjectURL(link.href);
};

record.addEventListener("change", () => {
  if (record.checked) {
    startRecording();

    return;
  }

  stopRecording?.();
  stopRecording = null;
});

findElement("export", HTMLButtonElement).addEventListener("click", exportTrace);

findElement("dispose", HTMLButtonElement).addEventListener("click", () => {
  pulse.dispose();
  observation = "disposed";
  render();
});

findElement("simulate-foreground", HTMLButtonElement).addEventListener(
  "click",
  () => mock.emit({ phase: "foreground", interaction: "available" }),
);
findElement("simulate-background", HTMLButtonElement).addEventListener(
  "click",
  () => mock.emit({ phase: "background", interaction: "unavailable" }),
);
findElement("simulate-unknown", HTMLButtonElement).addEventListener(
  "click",
  () => mock.emit({ phase: "unknown", interaction: "unknown" }),
);

// Recording starts before Pulse, so the first raw signals are kept.
if (parameters.has("record")) {
  record.checked = true;
  startRecording();
}

pulse.state.subscribe(render);
pulse.on("foreground", () => {
  // The refresh reports its own failure, so nothing is left unhandled.
  refreshCounter.refreshIfStale();
});
simulation.state.subscribe(render);
pulse.start();
simulation.start();
render();
