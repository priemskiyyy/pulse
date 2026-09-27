import { match } from "ts-pattern";

import { formatClockTime } from "example-shared/formatting/formatClockTime";
import type { RefreshStatus } from "example-shared/lab/types/RefreshStatus";

export const formatRefreshStatus = (status: RefreshStatus) =>
  match(status)
    .with({ state: "idle" }, () => "Not refreshed yet")
    .with({ state: "refreshing" }, () => "Refreshing")
    .with(
      { state: "refreshed" },
      ({ at }) => `Refreshed at ${formatClockTime(at)}`,
    )
    .with({ state: "failed" }, ({ message }) => `Failed: ${message}`)
    .exhaustive();
