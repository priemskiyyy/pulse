import type { Tone } from "example-shared/ui/types/Tone";

/** Each tone's RGB color, since React Native has no Tailwind classes to carry them. */
export const TONE_COLORS: Record<Tone, string> = {
  neutral: "#71717a",
  positive: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  accent: "#e11d48",
  info: "#2563eb",
};
