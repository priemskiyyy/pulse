import type { LifecycleObserver } from "src/types/LifecycleObserver";

/**
 * A plain `{ name, available, observe }` over one host: `available` probes it
 * cheaply, and `observe` registers synchronously and answers a synchronous
 * cleanup that removes only its own subscriptions.
 *
 * @example
 * ```ts
 * const adapter: LifecycleAdapter = {
 *   name: "always-foreground",
 *   available: () => true,
 *   observe: (observer) => {
 *     observer.next({ phase: "foreground", interaction: "unknown" });
 *
 *     return () => {};
 *   },
 * };
 * ```
 */
export type LifecycleAdapter = {
  name: string;
  available: () => boolean;
  observe: (observer: LifecycleObserver) => () => void;
};
