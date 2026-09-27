// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { StrictMode, useLayoutEffect } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { useLifecycle } from "src/react/useLifecycle";
import { createMockAdapter } from "src/testing/createMockAdapter";
import type { LifecycleSource } from "src/types/LifecycleSource";
import type { LifecycleState } from "src/types/LifecycleState";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { Pulse } from "src/utils/Pulse";

afterEach(cleanup);

const FOREGROUND: LifecycleState = {
  phase: "foreground",
  interaction: "available",
};

const BACKGROUND: LifecycleState = {
  phase: "background",
  interaction: "unavailable",
};

const createStarted = (initial: LifecycleState = FOREGROUND) => {
  const mock = createMockAdapter({ initial });
  const pulse = new Pulse({ adapter: mock.adapter });

  pulse.start();

  return { mock, pulse };
};

const Label = ({ source }: { source: LifecycleSource }) => {
  const { phase, interaction } = useLifecycle(source);

  return (
    <span>
      {phase}/{interaction}
    </span>
  );
};

test("R-001 R-002 many hooks share one observation, and unmounting them all stops nothing", () => {
  const { mock, pulse } = createStarted();
  let subscriptions = 0;

  const source: LifecycleSource = {
    state: {
      get: pulse.state.get,
      subscribe: (listener) => {
        const stop = pulse.state.subscribe(listener);

        subscriptions += 1;

        return () => {
          subscriptions -= 1;
          stop();
        };
      },
    },
  };

  const view = render(
    <>
      <Label source={source} />
      <Label source={source} />
      <Label source={source} />
    </>,
  );

  expect(view.container.textContent).toBe(
    "foreground/availableforeground/availableforeground/available",
  );
  expect(subscriptions).toBe(3);
  expect(mock.stats().observationsStarted).toBe(1);

  view.unmount();

  expect(subscriptions).toBe(0);
  expect(mock.stats().activeObservations).toBe(1);
});

test("R-003 a remount reads the current snapshot and replays nothing", () => {
  const { mock, pulse } = createStarted();
  const onForeground = vi.fn();

  pulse.on("foreground", onForeground);

  const first = render(<Label source={pulse} />);

  first.unmount();
  mock.emit(BACKGROUND);

  const second = render(<Label source={pulse} />);

  expect(second.container.textContent).toBe("background/unavailable");
  expect(onForeground).not.toHaveBeenCalled();
});

test("R-004 a stable snapshot renders once per commit, with no loop", () => {
  const { mock, pulse } = createStarted();
  const renders = vi.fn();

  const Counter = () => {
    renders(useLifecycle(pulse));

    return null;
  };

  render(<Counter />);
  act(() => {
    mock.emit(FOREGROUND);
    mock.emit({ phase: "foreground", interaction: "available" });
  });

  expect(renders).toHaveBeenCalledTimes(1);
  act(() => mock.emit(BACKGROUND));
  expect(renders).toHaveBeenCalledTimes(2);
  expect(renders.mock.calls[0]?.[0]).toBe(renders.mock.calls[0]?.[0]);
});

test("R-007 a change between render and subscription still reaches the component", () => {
  const { mock, pulse } = createStarted();

  const ChangeDuringCommit = () => {
    useLayoutEffect(() => {
      mock.emit(BACKGROUND);
    }, []);

    return null;
  };

  const view = render(
    <>
      <Label source={pulse} />
      <ChangeDuringCommit />
    </>,
  );

  expect(view.container.textContent).toBe("background/unavailable");
});

test("R-008 replacing the source moves the subscription and disposes neither", () => {
  const first = createStarted(FOREGROUND);
  const second = createStarted(BACKGROUND);
  const view = render(<Label source={first.pulse} />);

  view.rerender(<Label source={second.pulse} />);
  expect(view.container.textContent).toBe("background/unavailable");

  act(() => first.mock.emit(BACKGROUND));
  act(() => second.mock.emit(FOREGROUND));

  expect(view.container.textContent).toBe("foreground/available");
  expect(first.mock.stats().activeObservations).toBe(1);
  expect(second.mock.stats().activeObservations).toBe(1);
});

test("R-009 Strict Mode's repeated effects start nothing and dispose nothing", () => {
  const mock = createMockAdapter({ initial: FOREGROUND });
  const pulse = new Pulse({ adapter: mock.adapter });

  const view = render(
    <StrictMode>
      <Label source={pulse} />
    </StrictMode>,
  );

  expect(view.container.textContent).toBe("unknown/unknown");
  expect(mock.stats().observationsStarted).toBe(0);

  act(() => pulse.start());

  expect(view.container.textContent).toBe("foreground/available");
  view.unmount();
  expect(mock.stats()).toEqual({
    observationsStarted: 1,
    observationsClosed: 0,
    activeObservations: 1,
  });
});

test("R-013 a structural source works without being a Pulse", () => {
  let state = UNKNOWN_LIFECYCLE_STATE;
  const listeners = new Set<() => void>();

  const source: LifecycleSource = {
    state: {
      get: () => state,
      subscribe: (listener) => {
        listeners.add(listener);

        return () => {
          listeners.delete(listener);
        };
      },
    },
  };

  const view = render(<Label source={source} />);

  act(() => {
    state = BACKGROUND;
    listeners.forEach((listener) => listener());
  });

  expect(view.container.textContent).toBe("background/unavailable");
  view.unmount();
  expect(listeners.size).toBe(0);
});

test("R-016 unmounting before disposal leaves no subscription behind", () => {
  const { pulse } = createStarted();
  const release = vi.fn();
  const subscribe = pulse.state.subscribe;

  const source: LifecycleSource = {
    state: {
      get: pulse.state.get,
      subscribe: (listener) => {
        const stop = subscribe(listener);

        return () => {
          release();
          stop();
        };
      },
    },
  };

  const view = render(<Label source={source} />);

  view.unmount();
  pulse.dispose();

  expect(release).toHaveBeenCalledTimes(1);
});

test("R-018 services hear every edge even when React renders only the latest state", () => {
  const { mock, pulse } = createStarted();
  const edges: string[] = [];
  const renders = vi.fn();

  pulse.on("background", () => edges.push("background"));
  pulse.on("foreground", () => edges.push("foreground"));

  const Counter = () => {
    renders(useLifecycle(pulse).phase);

    return null;
  };

  render(<Counter />);
  act(() => {
    mock.emit(BACKGROUND);
    mock.emit(FOREGROUND);
  });

  expect(edges).toEqual(["background", "foreground"]);
  expect(renders.mock.calls.at(-1)).toEqual(["foreground"]);
});
