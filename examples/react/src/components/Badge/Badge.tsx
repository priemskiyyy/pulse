import type React from "react";
import type { ReactNode } from "react";

import type { Tone } from "example-shared/ui/types/Tone";
import { badgeStyles } from "example-shared/ui/styles/badgeStyles";

type BadgeProps = { tone: Tone; children: ReactNode };

export const Badge: React.FunctionComponent<BadgeProps> = ({
  tone,
  children,
}) => <span className={badgeStyles({ tone })}>{children}</span>;
