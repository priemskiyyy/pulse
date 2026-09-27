import type { LifecycleAdapter } from "src/types/LifecycleAdapter";

/**
 * A controllable host for the conformance suite: a fake or a real one, in a
 * foreground condition when created, that can move between phases, flush its
 * own delivery and count the subscriptions the adapter installed on it.
 *
 * @example
 * ```ts
 * const harness: AdapterConformanceHarness = {
 *   adapter: fromHost(host),
 *   foreground: () => host.set("foreground"),
 *   background: () => host.set("background"),
 *   settle: async () => {},
 *   subscriptionCount: () => host.listenerCount(),
 *   disposeHost: () => {},
 * };
 * ```
 */
export type AdapterConformanceHarness = {
  adapter: LifecycleAdapter;
  foreground: () => void | Promise<void>;
  background: () => void | Promise<void>;
  /** Resolves once the host has delivered everything it queued. */
  settle: () => Promise<void>;
  /** The number of subscriptions the adapter installed on the host right now, 0 before any observation. */
  subscriptionCount: () => number;
  disposeHost: () => void | Promise<void>;
};
