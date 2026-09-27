import type React from "react";
import { View } from "react-native";

import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { Button } from "src/components/Button/Button";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";
import { TimelineRow } from "src/components/Timeline/TimelineRow";
import { useEventLog } from "src/hooks/useEventLog";

type TimelinePanelProps = { lab: LifecycleLab };

export const TimelinePanel: React.FunctionComponent<TimelinePanelProps> = ({
  lab,
}) => {
  const entries = useEventLog(lab.timeline);

  return (
    <Panel
      title="Timeline"
      shows="Pulse's diagnostics and transitions, the refreshes and the raw host signals, newest first."
      aside={
        <Button label="Clear" variant="ghost" onPress={lab.timeline.clear} />
      }
    >
      {entries.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          description="Leave the app and come back, and each commit and transition appears here."
        />
      ) : (
        <View testID="timeline">
          {entries.map((entry) => (
            <TimelineRow key={entry.id} entry={entry} />
          ))}
        </View>
      )}
    </Panel>
  );
};
