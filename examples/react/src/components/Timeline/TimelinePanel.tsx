import {
  ClockCounterClockwise,
  DownloadSimple,
  Record,
  Trash,
} from "@phosphor-icons/react";
import type React from "react";

import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";
import { TimelineRow } from "src/components/Timeline/TimelineRow";
import { useEventLog } from "src/hooks/useEventLog";
import { useObservable } from "src/hooks/useObservable";
import { exportTrace } from "src/utils/exportTrace";

type TimelinePanelProps = { lab: LifecycleLab; documentToken: string };

export const TimelinePanel: React.FunctionComponent<TimelinePanelProps> = ({
  lab,
  documentToken,
}) => {
  const entries = useEventLog(lab.timeline);
  const recording = useObservable(lab.recording);

  const handleRecordPress = () => {
    lab.recording.set(!recording);
  };

  const handleExportPress = () => {
    exportTrace({ documentToken, entries });
  };

  return (
    <Panel
      title="Timeline"
      icon={ClockCounterClockwise}
      shows="Pulse's diagnostics and transitions, the refreshes, and, while recording, the raw browser events, newest first."
      aside={
        <>
          <button
            type="button"
            aria-pressed={recording}
            onClick={handleRecordPress}
            className={buttonStyles({ size: "small", pressed: recording })}
          >
            <Record aria-hidden="true" size={14} weight="bold" />
            Record raw signals
          </button>
          <button
            type="button"
            onClick={handleExportPress}
            className={buttonStyles({ size: "small" })}
          >
            <DownloadSimple aria-hidden="true" size={14} weight="bold" />
            Export trace
          </button>
          <button
            type="button"
            onClick={lab.timeline.clear}
            className={buttonStyles({ size: "small", variant: "ghost" })}
          >
            <Trash aria-hidden="true" size={14} weight="bold" />
            Clear
          </button>
        </>
      }
    >
      {entries.length === 0 ? (
        <EmptyState
          icon={ClockCounterClockwise}
          title="Nothing recorded yet"
          description="Switch tabs or windows, and each commit and transition appears here."
        />
      ) : (
        <ol
          aria-label="Timeline entries"
          className="flex max-h-[28rem] flex-col divide-y divide-zinc-200/70 overflow-y-auto text-sm dark:divide-zinc-800"
        >
          {entries.map((entry) => (
            <TimelineRow key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
    </Panel>
  );
};
