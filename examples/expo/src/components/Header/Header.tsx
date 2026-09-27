import type { LifecycleSource } from "@priemskiyyy/pulse";
import { useLifecycle } from "@priemskiyyy/pulse/react";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PHASE_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

type HeaderProps = { pulse: LifecycleSource };

export const Header: React.FunctionComponent<HeaderProps> = ({ pulse }) => {
  const { phase } = useLifecycle(pulse);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Lifecycle lab</Text>
      <Badge tone={PHASE_TONES[phase]}>{phase}</Badge>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#18181b" },
});
