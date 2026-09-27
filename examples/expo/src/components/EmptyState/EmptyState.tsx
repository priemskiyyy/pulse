import type React from "react";
import { StyleSheet, Text, View } from "react-native";

type EmptyStateProps = { title: string; description: string };

export const EmptyState: React.FunctionComponent<EmptyStateProps> = ({
  title,
  description,
}) => (
  <View style={styles.empty}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  empty: {
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: { fontSize: 15, fontWeight: "600", color: "#27272a" },
  description: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
    maxWidth: 320,
  },
});
