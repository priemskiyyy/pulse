import type React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { ChecksPanel } from "src/components/Checks/ChecksPanel";
import { Header } from "src/components/Header/Header";
import { RefreshPanel } from "src/components/Refresh/RefreshPanel";
import { SimulationPanel } from "src/components/Simulation/SimulationPanel";
import { StatePanel } from "src/components/State/StatePanel";
import { TimelinePanel } from "src/components/Timeline/TimelinePanel";

type ApplicationProps = { lab: LifecycleLab; runtime: string };

export const Application: React.FunctionComponent<ApplicationProps> = ({
  lab,
  runtime,
}) => (
  <View style={styles.root}>
    <Header pulse={lab.pulse} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        One Pulse observes this app: AppState on iOS and Android, the document
        on the web. The raw host signals sit beside it in the timeline.
      </Text>
      <StatePanel pulse={lab.pulse} runtime={runtime} />
      <RefreshPanel lab={lab} />
      <ChecksPanel />
      <TimelinePanel lab={lab} />
      <SimulationPanel lab={lab} />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafafa" },
  content: { flexDirection: "column", gap: 16, padding: 16 },
  intro: { fontSize: 13, color: "#52525b" },
});
