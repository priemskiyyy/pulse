import type { Tone } from "example-shared/ui/types/Tone";
import type React from "react";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { TONE_COLORS } from "src/utils/constants/colors";

type BadgeProps = { tone: Tone; children: ReactNode };

export const Badge: React.FunctionComponent<BadgeProps> = ({
  tone,
  children,
}) => (
  <View style={[styles.badge, { borderColor: TONE_COLORS[tone] }]}>
    <View style={[styles.dot, { backgroundColor: TONE_COLORS[tone] }]} />
    <Text style={[styles.label, { color: TONE_COLORS[tone] }]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: "600" },
});
