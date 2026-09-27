import type { InteractionState } from "@priemskiyyy/pulse";
import type React from "react";

import { INTERACTION_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

type InteractionBadgeProps = { interaction: InteractionState };

export const InteractionBadge: React.FunctionComponent<
  InteractionBadgeProps
> = ({ interaction }) => (
  <Badge tone={INTERACTION_TONES[interaction]}>{interaction}</Badge>
);
