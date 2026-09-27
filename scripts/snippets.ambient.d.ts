// Names the documentation's snippets use without declaring, as an application
// would have them. A script with no imports, so these are global and ambient.
declare const pulse: import("@priemskiyyy/pulse").Pulse;
declare const service: { revalidateIfStale: () => Promise<void> };
declare const reportError: (error: unknown) => void;
declare const refreshIfStale: (observedAway: number | null) => void;

declare const createHostHarness: () => import("@priemskiyyy/pulse/testing").AdapterConformanceHarness;

declare module "src/lifecycle" {
  export const pulse: import("@priemskiyyy/pulse").Pulse;
}
