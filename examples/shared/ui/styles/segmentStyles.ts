import { cva } from "class-variance-authority";

export const segmentStyles = cva(
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "bg-white text-zinc-900 shadow-sm ring-2 ring-rose-500/60 dark:bg-zinc-950 dark:text-zinc-100",
        false:
          "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      },
    },
  },
);
