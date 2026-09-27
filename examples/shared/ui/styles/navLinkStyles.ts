import { cva } from "class-variance-authority";

export const navLinkStyles = cva(
  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500",
  {
    variants: {
      current: {
        true: "bg-zinc-900 text-white dark:bg-rose-400 dark:text-zinc-950",
        false:
          "text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
      },
    },
  },
);
