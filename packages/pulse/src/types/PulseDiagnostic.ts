import type { LifecycleState } from "src/types/LifecycleState";

/**
 * One frozen record of what the runtime did: it `started`, it made a `commit`,
 * or it suppressed a `duplicate`. It carries no source event, raw value or
 * history.
 *
 * @example
 * ```ts
 * const onDiagnostic = (diagnostic: PulseDiagnostic) => {
 *   if (diagnostic.type === "commit") {
 *     console.debug(diagnostic.sequence, diagnostic.to, diagnostic.transition);
 *   }
 * };
 * ```
 */
export type PulseDiagnostic =
  | { type: "started"; adapter: { name: string } }
  | {
      type: "commit";
      sequence: number;
      from: LifecycleState;
      to: LifecycleState;
      observedAt: number | null;
      transition: "foreground" | "background" | null;
    }
  | { type: "duplicate"; sequence: number; state: LifecycleState };
