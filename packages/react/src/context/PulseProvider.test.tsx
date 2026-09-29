// @vitest-environment jsdom
import { Pulse, UNKNOWN_LIFECYCLE_STATE } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import type { PropsWithChildren } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { PulseProvider } from "src/context/PulseProvider";
import { useLifecycle } from "src/hooks/useLifecycle";
import { usePulse } from "src/hooks/usePulse";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const createPulse = () => {
  const mock = createMockAdapter({
    initial: { phase: "foreground", interaction: "available" },
  });

  const pulse = new Pulse({ adapter: mock.adapter });

  return { mock, pulse };
};

const withProvider =
  (pulse: Pulse) =>
  ({ children }: PropsWithChildren) => (
    <PulseProvider pulse={pulse}>{children}</PulseProvider>
  );

test("R-019 useLifecycle without a source reads the provider's Pulse and follows it", () => {
  const { mock, pulse } = createPulse();

  pulse.start();

  const { result } = renderHook(() => useLifecycle(), {
    wrapper: withProvider(pulse),
  });

  expect(result.current.phase).toBe("foreground");

  act(() => {
    mock.emit({ phase: "background", interaction: "unavailable" });
  });

  expect(result.current.phase).toBe("background");
});

test("R-019 a passed source wins over the provider's Pulse", () => {
  const provided = createPulse();
  const passed = createPulse();

  provided.pulse.start();

  const { result } = renderHook(() => useLifecycle(passed.pulse), {
    wrapper: withProvider(provided.pulse),
  });

  expect(result.current).toBe(UNKNOWN_LIFECYCLE_STATE);
});

test("R-019 usePulse returns the provider's Pulse", () => {
  const { pulse } = createPulse();

  const { result } = renderHook(() => usePulse(), {
    wrapper: withProvider(pulse),
  });

  expect(result.current).toBe(pulse);
});

test("R-020 without a provider, usePulse and a sourceless useLifecycle throw INVALID_CONFIGURATION", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  const invalid = expect.objectContaining({
    name: "PulseError",
    code: "INVALID_CONFIGURATION",
  });

  expect(() => renderHook(() => usePulse())).toThrow(invalid);
  expect(() => renderHook(() => useLifecycle())).toThrow(invalid);
});

test("R-021 the provider starts nothing and disposes nothing, even in Strict Mode", () => {
  const { mock, pulse } = createPulse();

  const view = render(
    <StrictMode>
      <PulseProvider pulse={pulse}>
        <span />
      </PulseProvider>
    </StrictMode>,
  );

  expect(pulse.state.get()).toBe(UNKNOWN_LIFECYCLE_STATE);

  view.unmount();
  pulse.start();

  expect(pulse.state.get().phase).toBe("foreground");
  expect(mock.stats().activeObservations).toBe(1);
});
