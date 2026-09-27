import { useLifecycle } from "@priemskiyyy/pulse/react";
import { StatusBar } from "expo-status-bar";
import { useSyncExternalStore } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { pulse, runtime } from "src/lifecycle";
import { trace } from "src/trace";

const CHECKS = [
  "Open Notification Center or Control Center on iOS, or the notification drawer on Android.",
  "Switch to another app and back.",
  "Lock and unlock the device.",
  "Quit the app and relaunch it: a fresh start begins at unknown.",
];

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text
      testID={label}
      style={value === "unknown" ? styles.unknown : styles.value}
    >
      {value}
    </Text>
  </View>
);

export const App = () => {
  const { phase, interaction } = useLifecycle(pulse);
  const entries = useSyncExternalStore(trace.subscribe, trace.get, trace.get);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Pulse lifecycle lab</Text>

      <Field label="phase" value={phase} />
      <Field label="interaction" value={interaction} />
      <Field label="runtime" value={runtime} />

      <Text style={styles.heading}>Checks</Text>
      {CHECKS.map((check) => (
        <Text key={check} style={styles.check}>
          {check}
        </Text>
      ))}

      <Text style={styles.heading}>Trace</Text>
      <View testID="trace">
        {entries.map(({ id, source, text }) => (
          <Text key={id} style={styles.entry}>
            {source === "raw" ? "raw   " : "pulse "}
            {text}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { gap: 8, padding: 24, paddingTop: 64 },
  title: { fontSize: 24, fontWeight: "600" },
  heading: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  field: { flexDirection: "row", gap: 8 },
  label: { color: "#52525b", width: 96 },
  value: { flex: 1, fontFamily: "monospace" },
  unknown: {
    color: "#a16207",
    flex: 1,
    fontFamily: "monospace",
    fontStyle: "italic",
  },
  check: { color: "#3f3f46" },
  entry: { fontFamily: "monospace", fontSize: 12 },
});
