import type { Pulse } from "@priemskiyyy/pulse";

import { PulseProvider } from "src/context/PulseProvider";
import { useLifecycle } from "src/primitives/useLifecycle";

const Status = () => {
  const state = useLifecycle();

  return <span>{`${state().phase}/${state().interaction}`}</span>;
};

export const StatusView = (props: { pulse: Pulse }) => (
  <PulseProvider pulse={props.pulse}>
    <Status />
  </PulseProvider>
);
