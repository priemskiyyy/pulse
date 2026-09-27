import type React from "react";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type PanelProps = {
  title: string;
  shows: string;
  aside?: ReactNode;
  children: ReactNode;
};

export const Panel: React.FunctionComponent<PanelProps> = ({
  title,
  shows,
  aside,
  children,
}) => (
  <View aria-label={title} style={styles.panel}>
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {aside === undefined ? null : <View style={styles.aside}>{aside}</View>}
      </View>
      <Text style={styles.shows}>{shows}</Text>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    flexDirection: "column",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  header: { flexDirection: "column", gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "600", color: "#27272a" },
  aside: { marginLeft: "auto" },
  shows: { fontSize: 13, color: "#71717a" },
});
