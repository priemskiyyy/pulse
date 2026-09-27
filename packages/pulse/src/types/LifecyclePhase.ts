/**
 * The adapter's lifecycle category for the observed host: `foreground`,
 * `background`, or `unknown` when there is no usable evidence. It is not literal
 * pixel visibility, and `unknown` never means `background`.
 *
 * @example
 * ```ts
 * const phase: LifecyclePhase = pulse.state.get().phase;
 * ```
 */
export type LifecyclePhase = "foreground" | "background" | "unknown";
