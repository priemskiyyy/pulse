import type React from "react";

import { formatClockTime } from "example-shared/formatting/formatClockTime";
import { formatTimelineEntry } from "example-shared/formatting/formatTimelineEntry";
import { TIMELINE_SOURCE_LABELS } from "example-shared/lab/constants/labels";
import type { TimelineEntry } from "example-shared/lab/types/TimelineEntry";
import { TIMELINE_SOURCE_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

type TimelineRowProps = { entry: TimelineEntry };

export const TimelineRow: React.FunctionComponent<TimelineRowProps> = ({
  entry,
}) => (
  <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 py-2">
    <time
      dateTime={new Date(entry.at).toISOString()}
      className="font-mono text-xs text-zinc-500 tabular-nums"
    >
      {formatClockTime(entry.at)}
    </time>
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <Badge tone={TIMELINE_SOURCE_TONES[entry.source]}>
        {TIMELINE_SOURCE_LABELS[entry.source]}
      </Badge>
      <span className="min-w-0 break-words">{formatTimelineEntry(entry)}</span>
    </span>
  </li>
);
