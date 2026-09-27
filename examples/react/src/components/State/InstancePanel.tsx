import { ArrowSquareOut, Fingerprint, Prohibit } from "@phosphor-icons/react";
import type React from "react";

import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { Badge } from "src/components/Badge/Badge";
import { Fact } from "src/components/Fact/Fact";
import { Panel } from "src/components/Panel/Panel";
import { useObservable } from "src/hooks/useObservable";

type InstancePanelProps = { lab: LifecycleLab; documentToken: string };

export const InstancePanel: React.FunctionComponent<InstancePanelProps> = ({
  lab,
  documentToken,
}) => {
  const observing = useObservable(lab.observing);

  return (
    <Panel
      title="Instance"
      icon={Fingerprint}
      shows="This document's token and whether its Pulse still observes. Dispose is final; reload for a new one."
      aside={
        <>
          <button
            type="button"
            disabled={!observing}
            onClick={lab.stopObserving}
            className={buttonStyles({ size: "small" })}
          >
            <Prohibit aria-hidden="true" size={14} weight="bold" />
            Dispose
          </button>
          <a href="second.html" className={buttonStyles({ size: "small" })}>
            <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
            Open the second page
          </a>
        </>
      }
    >
      <dl className="grid gap-2 sm:grid-cols-2">
        <Fact
          term="Document token"
          hint="Made once per document. A back/forward cache restore keeps it."
        >
          {documentToken}
        </Fact>
        <Fact
          term="Observation"
          hint="Disposing removes only Pulse's listeners; the page's own stay."
        >
          <Badge tone={observing ? "positive" : "neutral"}>
            {observing ? "observing" : "disposed"}
          </Badge>
        </Fact>
      </dl>
    </Panel>
  );
};
