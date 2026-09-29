import type { LifecycleSource } from "@priemskiyyy/pulse";
import { useLifecycle } from "@priemskiyyy/pulse-react";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  INTERACTION_TONES,
  PHASE_TONES,
} from "example-shared/ui/constants/tones";
import { Fact } from "src/components/Fact/Fact";
import { Panel } from "src/components/Panel/Panel";

type StatePanelProps = { pulse: LifecycleSource; runtime: string };

export const StatePanel: React.FunctionComponent<StatePanelProps> = ({
  pulse,
  runtime,
}) => {
  const { phase, interaction } = useLifecycle(pulse);

  return (
    <Panel
      title="State"
      shows="The frozen snapshot useLifecycle reads. Unknown means no evidence yet, never background."
    >
      <View style={styles.facts}>
        <Fact
          term="Phase"
          value={phase}
          tone={PHASE_TONES[phase]}
          testID="phase"
        />
        <Fact
          term="Interaction"
          value={interaction}
          tone={INTERACTION_TONES[interaction]}
          testID="interaction"
        />
      </View>
      <Text testID="runtime" style={styles.runtime}>
        {runtime}
      </Text>
    </Panel>
  );
};

const styles = StyleSheet.create({
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  runtime: { fontFamily: "monospace", fontSize: 12, color: "#71717a" },
});
