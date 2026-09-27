import type React from "react";
import type { ReactNode } from "react";
import { useId } from "react";

type FactProps = { term: string; hint: string; children: ReactNode };

export const Fact: React.FunctionComponent<FactProps> = ({
  term,
  hint,
  children,
}) => {
  const id = useId();

  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <dt id={id} className="text-xs font-medium text-zinc-500">
        {term}
      </dt>
      <dd aria-labelledby={id} className="font-mono text-sm break-all">
        {children}
      </dd>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
};
