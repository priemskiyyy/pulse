import type { Icon } from "@phosphor-icons/react";
import type React from "react";

type EmptyStateProps = { icon: Icon; title: string; description: string };

export const EmptyState: React.FunctionComponent<EmptyStateProps> = ({
  icon: EmptyIcon,
  title,
  description,
}) => (
  <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center dark:border-zinc-700">
    <EmptyIcon
      aria-hidden="true"
      size={22}
      weight="duotone"
      className="text-zinc-400"
    />
    <p className="text-base font-medium">{title}</p>
    <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
      {description}
    </p>
  </div>
);
