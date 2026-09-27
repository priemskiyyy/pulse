import { cva } from "class-variance-authority";

import type { Tone } from "example-shared/ui/types/Tone";

export const dotStyles = cva("shrink-0 rounded-full", {
  variants: {
    tone: {
      neutral: "bg-zinc-400",
      positive: "bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.2)]",
      warning: "animate-pulse bg-yellow-500",
      danger: "bg-red-500 shadow-[0_0_0_3px_rgb(239_68_68/0.25)]",
      accent: "bg-rose-500",
      info: "animate-pulse bg-sky-500",
    } satisfies Record<Tone, string>,
    size: {
      small: "size-2",
      regular: "size-2.5",
    },
  },
  defaultVariants: { size: "small" },
});
