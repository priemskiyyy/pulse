import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Tone } from "example-shared/ui/types/Tone";
import { TONE_COLORS } from "src/utils/constants/colors";

type FactProps = { term: string; value: string; tone: Tone; testID: string };

export const Fact: React.FunctionComponent<FactProps> = ({
  term,
  value,
  tone,
  testID,
}) => (
  <View style={styles.fact}>
    <Text style={styles.term}>{term}</Text>
    <Text testID={testID} style={[styles.value, { color: TONE_COLORS[tone] }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  fact: {
    flexDirection: "column",
    gap: 2,
    flexBasis: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  term: { fontSize: 12, fontWeight: "500", color: "#71717a" },
  value: { fontFamily: "monospace", fontSize: 14 },
});
