import type React from "react";
import { StyleSheet, View } from "react-native";

import { formatRefreshStatus } from "example-shared/formatting/formatRefreshStatus";
import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { REFRESH_TONES } from "example-shared/ui/constants/tones";
import { Button } from "src/components/Button/Button";
import { Fact } from "src/components/Fact/Fact";
import { Panel } from "src/components/Panel/Panel";
import { useObservable } from "src/hooks/useObservable";

type RefreshPanelProps = { lab: LifecycleLab };

export const RefreshPanel: React.FunctionComponent<RefreshPanelProps> = ({
  lab,
}) => {
  const { refreshes, status } = useObservable(lab.refresh);
  const failNext = useObservable(lab.failNextRefresh);

  const handleFailNextPress = () => {
    lab.failNextRefresh.set(!failNext);
  };

  return (
    <Panel
      title="Stale-data refresh"
      shows="Coming back after 30 seconds refreshes the data, one request at a time. A foreground transition is not proof that a person came back."
    >
      <View style={styles.facts}>
        <Fact
          term="Refreshes"
          value={String(refreshes)}
          tone="neutral"
          testID="refreshes"
        />
        <Fact
          term="Last refresh"
          value={formatRefreshStatus(status)}
          tone={REFRESH_TONES[status.state]}
          testID="last-refresh"
        />
      </View>
      <Button
        label={failNext ? "The next refresh fails" : "Fail the next refresh"}
        variant="ghost"
        onPress={handleFailNextPress}
      />
    </Panel>
  );
};

const styles = StyleSheet.create({
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
