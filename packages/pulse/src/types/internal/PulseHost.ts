import type { PulseDiagnostic } from "src/types/PulseDiagnostic";
import type { PulseErrorContext } from "src/types/PulseErrorContext";

export type PulseHost = {
  adapter: { name: string };
  now: () => number;
  onError: ((error: unknown, context: PulseErrorContext) => void) | null;
  onDiagnostic: ((diagnostic: PulseDiagnostic) => void) | null;
};
