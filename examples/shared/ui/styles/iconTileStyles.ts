import { cva } from "class-variance-authority";

export const iconTileStyles = cva(
  "inline-flex shrink-0 items-center justify-center bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  {
    variants: {
      size: {
        regular: "size-9 rounded-xl",
        small: "size-8 rounded-lg",
      },
    },
    defaultVariants: { size: "regular" },
  },
);
