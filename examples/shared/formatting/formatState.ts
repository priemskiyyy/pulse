import type { LifecycleState } from "@priemskiyyy/pulse";

export const formatState = ({ phase, interaction }: LifecycleState) =>
  `${phase} / ${interaction}`;
