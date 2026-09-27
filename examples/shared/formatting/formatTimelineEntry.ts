import { match } from "ts-pattern";

import { formatAway } from "example-shared/formatting/formatAway";
import { formatRefreshStatus } from "example-shared/formatting/formatRefreshStatus";
import { formatState } from "example-shared/formatting/formatState";
import type { TimelineEntry } from "example-shared/lab/types/TimelineEntry";

/** One timeline entry in plain words. */
export const formatTimelineEntry = (entry: TimelineEntry) =>
  match(entry)
    .with(
      { source: "pulse", diagnostic: { type: "started" } },
      ({ diagnostic }) =>
        `Started observing through ${diagnostic.adapter.name}`,
    )
    .with(
      { source: "pulse", diagnostic: { type: "unavailable" } },
      ({ diagnostic }) =>
        `${diagnostic.adapter.name} is unavailable here, so the state stays unknown`,
    )
    .with(
      { source: "pulse", diagnostic: { type: "commit" } },
      ({ diagnostic }) =>
        `#${diagnostic.sequence} ${formatState(diagnostic.from)} -> ${formatState(diagnostic.to)}`,
    )
    .with(
      { source: "pulse", diagnostic: { type: "duplicate" } },
      ({ diagnostic }) =>
        `Same state again, ${formatState(diagnostic.state)}, nothing committed`,
    )
    .with(
      { source: "transition", event: { type: "foreground" } },
      ({ event }) => `Foreground, ${formatAway(event.observedAway)}`,
    )
    .with(
      { source: "transition", event: { type: "background" } },
      () => "Background",
    )
    .with({ source: "host" }, ({ signal }) => `${signal.name} ${signal.detail}`)
    .with({ source: "refresh" }, ({ status }) => formatRefreshStatus(status))
    .exhaustive();
