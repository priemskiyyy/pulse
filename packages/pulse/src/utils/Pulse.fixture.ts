import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { LifecycleState } from "src/types/LifecycleState";
import type { Pulse } from "src/utils/Pulse";

export const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "available",
};

export const FOREGROUND_UNAVAILABLE: LifecycleState = {
  phase: "foreground",
  interaction: "unavailable",
};

export const BACKGROUND: LifecycleState = {
  phase: "background",
  interaction: "unavailable",
};

export const UNKNOWN: LifecycleState = {
  phase: "unknown",
  interaction: "unknown",
};

// A hostile adapter keeps its observer so a test can call it at any time.
export const createCapturingAdapter = (
  setup: (observer: LifecycleObserver) => unknown = () => () => {},
) => {
  const observers: LifecycleObserver[] = [];

  const adapter: LifecycleAdapter = {
    name: "capturing",
    available: () => true,
    observe: (observer) => {
      observers.push(observer);

      const cleanup = setup(observer);

      return typeof cleanup === "function" ? () => cleanup() : () => {};
    },
  };

  const getObserver = () => {
    const [observer] = observers;

    if (observer === undefined) {
      throw new Error("The adapter was not observed.");
    }

    return observer;
  };

  return { adapter, observers, getObserver };
};

export const recordDelivery = (pulse: Pulse) => {
  const log: string[] = [];

  pulse.state.subscribe(() => {
    const { phase, interaction } = pulse.state.get();

    log.push(`state ${phase}/${interaction}`);
  });

  pulse.on("foreground", (event) => {
    log.push(`foreground #${event.sequence}`);
  });

  pulse.on("background", (event) => {
    log.push(`background #${event.sequence}`);
  });

  return log;
};
