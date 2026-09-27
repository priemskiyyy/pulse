import type React from "react";
import { StyleSheet, Text } from "react-native";

import { Panel } from "src/components/Panel/Panel";

const CHECKS = [
  "Open Notification Center or Control Center on iOS: inactive keeps foreground with interaction unavailable.",
  "Open the notification drawer on Android: a blur makes interaction unavailable while the app stays active.",
  "Switch to another app and back: background, then foreground.",
  "Lock and unlock the device.",
  "Quit and relaunch: a fresh start begins at unknown, with no transition from the last run.",
];

export const ChecksPanel: React.FunctionComponent = () => (
  <Panel
    title="Checks on a device"
    shows="Run each one and compare the trace below with what the device did."
  >
    {CHECKS.map((check, index) => (
      <Text key={check} style={styles.check}>
        {`${index + 1}. ${check}`}
      </Text>
    ))}
  </Panel>
);

const styles = StyleSheet.create({
  check: { fontSize: 13, color: "#3f3f46" },
});
