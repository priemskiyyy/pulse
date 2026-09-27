import type { LifecyclePhase } from "@priemskiyyy/pulse";
import type React from "react";

import { PHASE_TONES } from "example-shared/ui/constants/tones";
import { dotStyles } from "example-shared/ui/styles/dotStyles";
import { Badge } from "src/components/Badge/Badge";

type PhaseBadgeProps = { phase: LifecyclePhase };

export const PhaseBadge: React.FunctionComponent<PhaseBadgeProps> = ({
  phase,
}) => {
  const tone = PHASE_TONES[phase];

  return (
    <Badge tone={tone}>
      <span aria-hidden="true" className={dotStyles({ tone })} />
      {phase}
    </Badge>
  );
};
