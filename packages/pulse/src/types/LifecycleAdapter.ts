import type { LifecycleObserver } from "src/types/LifecycleObserver";

/**
 * A plain `{ name, observe }` over one platform source. `observe` registers
 * synchronously, may report its baseline now or later, and answers a
 * synchronous cleanup that removes only its own subscriptions.
 *
 * @example
 * ```ts
 * const adapter: LifecycleAdapter = {
 *   name: "always-foreground",
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
  observe: (observer: LifecycleObserver) => () => void;
};
