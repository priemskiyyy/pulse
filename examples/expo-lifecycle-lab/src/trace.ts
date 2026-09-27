import type { LifecycleState, PulseDiagnostic } from "@priemskiyyy/pulse";

export type TraceEntry = {
  id: number;
  at: number;
  source: "raw" | "pulse";
  text: string;
};

const TRACE_LIMIT = 50;

let entries: TraceEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

export const describeState = ({ phase, interaction }: LifecycleState) =>
  `${phase} / ${interaction}`;

// A bounded, local trace for comparing raw host signals with Pulse commits. Lab code, not a Pulse API.
export const trace = {
  get: () => entries,
  subscribe: (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  push: (source: TraceEntry["source"], text: string) => {
    entries = [
      ...entries.slice(-(TRACE_LIMIT - 1)),
      { id: nextId, at: Date.now(), source, text },
    ];
    nextId += 1;

    for (const listener of listeners) {
      listener();
    }
  },
};

export const recordCommit = (diagnostic: PulseDiagnostic) => {
  if (diagnostic.type !== "commit") {
    return;
  }

  const { sequence, from, to, transition } = diagnostic;
  const suffix = transition === null ? "" : ` (${transition})`;

  trace.push(
    "pulse",
    `#${sequence} ${describeState(from)} -> ${describeState(to)}${suffix}`,
  );
};
