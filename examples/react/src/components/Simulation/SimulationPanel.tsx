import { Flask } from "@phosphor-icons/react";
import { useLifecycle } from "@priemskiyyy/pulse/react";
import type React from "react";

import {
  SIMULATED_STATE_OPTIONS,
  SIMULATED_STATES,
} from "example-shared/lab/constants/simulatedStates";
import { getSimulatedStateId } from "example-shared/lab/getSimulatedStateId";
import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import type { SimulatedStateId } from "example-shared/lab/types/SimulatedStateId";
import { Badge } from "src/components/Badge/Badge";
import { InteractionBadge } from "src/components/Badge/InteractionBadge";
import { PhaseBadge } from "src/components/Badge/PhaseBadge";
import { Fact } from "src/components/Fact/Fact";
import { Panel } from "src/components/Panel/Panel";
import { SegmentedControl } from "src/components/SegmentedControl/SegmentedControl";

type SimulationPanelProps = { lab: LifecycleLab };

export const SimulationPanel: React.FunctionComponent<SimulationPanelProps> = ({
  lab,
}) => {
  const state = useLifecycle(lab.simulation);

  const handleSelect = (id: SimulatedStateId) => {
    lab.simulate(SIMULATED_STATES[id]);
  };

  return (
    <Panel
      title="Simulated source"
      icon={Flask}
      shows="A second Pulse over the mock adapter from @priemskiyyy/pulse/testing. Nothing here comes from the browser, and the real state above never moves."
      aside={<Badge tone="warning">Simulation</Badge>}
    >
      <SegmentedControl
        label="Simulated state"
        options={SIMULATED_STATE_OPTIONS}
        value={getSimulatedStateId(state)}
        onSelect={handleSelect}
      />
      <dl className="grid gap-2 sm:grid-cols-2">
        <Fact term="Simulated phase" hint="What the mock adapter reported.">
          <PhaseBadge phase={state.phase} />
        </Fact>
        <Fact
          term="Simulated interaction"
          hint="Inactive keeps the phase and loses the interaction."
        >
          <InteractionBadge interaction={state.interaction} />
        </Fact>
      </dl>
    </Panel>
  );
};
