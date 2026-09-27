/**
 * The names of the checks an adapter passed, in the order they ran. A failed
 * check throws instead of appearing here.
 *
 * @example
 * ```ts
 * const { passed }: AdapterConformanceReport = await testLifecycleAdapter(createHarness);
 * ```
 */
export type AdapterConformanceReport = {
  passed: string[];
};
