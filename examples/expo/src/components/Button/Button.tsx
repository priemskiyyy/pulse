import type React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
};

export const Button: React.FunctionComponent<ButtonProps> = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}) => (
  <Pressable
    accessibilityRole="button"
    aria-label={label}
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.button,
      variant === "primary" ? styles.primary : styles.ghost,
      disabled ? styles.disabled : null,
    ]}
  >
    <Text
      style={variant === "primary" ? styles.primaryLabel : styles.ghostLabel}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  primary: { backgroundColor: "#18181b" },
  ghost: { backgroundColor: "#f4f4f5" },
  disabled: { opacity: 0.5 },
  primaryLabel: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  ghostLabel: { color: "#27272a", fontSize: 14, fontWeight: "600" },
});
