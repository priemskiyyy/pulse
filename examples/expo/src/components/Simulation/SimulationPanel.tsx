import { useLifecycle } from "@priemskiyyy/pulse/react";
import type React from "react";
import { StyleSheet, View } from "react-native";

import { formatState } from "example-shared/formatting/formatState";
import {
  SIMULATED_STATE_OPTIONS,
  SIMULATED_STATES,
} from "example-shared/lab/constants/simulatedStates";
import { getSimulatedStateId } from "example-shared/lab/getSimulatedStateId";
import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { PHASE_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { Button } from "src/components/Button/Button";
import { Fact } from "src/components/Fact/Fact";
import { Panel } from "src/components/Panel/Panel";

type SimulationPanelProps = { lab: LifecycleLab };

export const SimulationPanel: React.FunctionComponent<SimulationPanelProps> = ({
  lab,
}) => {
  const state = useLifecycle(lab.simulation);
  const selected = getSimulatedStateId(state);

  return (
    <Panel
      title="Simulated source"
      shows="A second Pulse over the mock adapter. Nothing here comes from the device."
      aside={<Badge tone="warning">Simulation</Badge>}
    >
      <View style={styles.choices}>
        {SIMULATED_STATE_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            label={label}
            variant={value === selected ? "primary" : "ghost"}
            onPress={() => lab.simulate(SIMULATED_STATES[value])}
          />
        ))}
      </View>
      <Fact
        term="Simulated state"
        value={formatState(state)}
        tone={PHASE_TONES[state.phase]}
        testID="simulated-state"
      />
    </Panel>
  );
};

const styles = StyleSheet.create({
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
