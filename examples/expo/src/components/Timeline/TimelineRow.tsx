import type React from "react";
import { StyleSheet, Text, View } from "react-native";

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
  <View style={styles.row}>
    <Text style={styles.time}>{formatClockTime(entry.at)}</Text>
    <Badge tone={TIMELINE_SOURCE_TONES[entry.source]}>
      {TIMELINE_SOURCE_LABELS[entry.source]}
    </Badge>
    <Text style={styles.text}>{formatTimelineEntry(entry)}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  time: { fontFamily: "monospace", fontSize: 12, color: "#71717a" },
  text: { flexShrink: 1, fontSize: 13, color: "#27272a" },
});
