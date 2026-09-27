import type { LifecycleState } from "src/types/LifecycleState";

export type Timeline = {
  state: LifecycleState;
  sequence: number;
  /** The latest finite clock sample, which the next one must not precede. */
  lastSample: number | null;
  /** The timestamp of an observed departure still waiting for its entry. */
  departure: number | null;
};
