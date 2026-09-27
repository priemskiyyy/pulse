export type RefreshStatus =
  | { state: "idle" }
  | { state: "refreshing" }
  | { state: "refreshed"; at: number }
  | { state: "failed"; message: string };
