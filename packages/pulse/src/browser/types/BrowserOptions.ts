/**
 * Which window's document the browser adapter observes. The default is the
 * global `window`, resolved only when observation starts, so creating the
 * adapter on a server reads nothing.
 *
 * @example
 * ```ts
 * const options: BrowserOptions = { target: iframe.contentWindow ?? window };
 * ```
 */
export type BrowserOptions = {
  /** A borrowed window; Pulse observes its own document and never a parent's. */
  target?: Window;
};
