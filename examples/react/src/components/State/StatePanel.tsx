import { Pulse as PulseIcon } from "@phosphor-icons/react";
import type { LifecycleSource } from "@priemskiyyy/pulse";
import { useLifecycle } from "@priemskiyyy/pulse/react";
import type React from "react";

import { Fact } from "src/components/Fact/Fact";
import { InteractionBadge } from "src/components/Badge/InteractionBadge";
import { PhaseBadge } from "src/components/Badge/PhaseBadge";
import { Panel } from "src/components/Panel/Panel";

type StatePanelProps = { pulse: LifecycleSource };

export const StatePanel: React.FunctionComponent<StatePanelProps> = ({
  pulse,
}) => {
  const { phase, interaction } = useLifecycle(pulse);

  return (
    <Panel
      title="State"
      icon={PulseIcon}
      shows="The frozen snapshot useLifecycle reads. Unknown means no evidence yet, never background."
    >
      <dl className="grid gap-2 sm:grid-cols-2">
        <Fact
          term="Phase"
          hint="Visible is foreground; hidden, pagehide or prerendering is background."
        >
          <PhaseBadge phase={phase} />
        </Fact>
        <Fact
          term="Interaction"
          hint="Whether the page has focus. Background is always unavailable."
        >
          <InteractionBadge interaction={interaction} />
        </Fact>
      </dl>
    </Panel>
  );
};
