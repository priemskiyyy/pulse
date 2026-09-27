import { ArrowsClockwise, WarningCircle } from "@phosphor-icons/react";
import type React from "react";

import { formatRefreshStatus } from "example-shared/formatting/formatRefreshStatus";
import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { REFRESH_TONES } from "example-shared/ui/constants/tones";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { Badge } from "src/components/Badge/Badge";
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
      icon={ArrowsClockwise}
      shows="A foreground transition refreshes data older than the threshold, one request at a time. It is not proof that a person came back."
      aside={
        <button
          type="button"
          aria-pressed={failNext}
          onClick={handleFailNextPress}
          className={buttonStyles({ size: "small", pressed: failNext })}
        >
          <WarningCircle aria-hidden="true" size={14} weight="bold" />
          Fail the next refresh
        </button>
      }
    >
      <dl className="grid gap-2 sm:grid-cols-2">
        <Fact
          term="Refreshes"
          hint="Successful refreshes since the page loaded."
        >
          {refreshes}
        </Fact>
        <Fact
          term="Last refresh"
          hint="A failure keeps the old data and waits for the next return."
        >
          <Badge tone={REFRESH_TONES[status.state]}>
            {formatRefreshStatus(status)}
          </Badge>
        </Fact>
      </dl>
    </Panel>
  );
};
