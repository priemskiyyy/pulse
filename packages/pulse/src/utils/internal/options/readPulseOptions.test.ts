import { expect, test, vi } from "vitest";

import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import type { PulseOptions } from "src/types/PulseOptions";
import { readPulseOptions } from "src/utils/internal/options/readPulseOptions";

const adapter: LifecycleAdapter = { name: "test", observe: () => () => {} };

const expectInvalid = (options: unknown) => {
  // @ts-expect-error A JavaScript caller can pass anything.
  const read = () => readPulseOptions(options);

  expect(read).toThrow(expect.objectContaining({ code: "INVALID_OPTIONS" }));
};

test("C-023 malformed options are refused before anything is observed", () => {
  const observe = vi.fn(() => () => {});

  expectInvalid(undefined);
  expectInvalid(null);
  expectInvalid("browser");
  expectInvalid({});
  expectInvalid({ adapter: null });
  expectInvalid({ adapter: { observe } });
  expectInvalid({ adapter: { name: "", observe } });
  expectInvalid({ adapter: { name: 1, observe } });
  expectInvalid({ adapter: { name: "test", observe: "observe" } });
  expectInvalid({ adapter, now: 1 });
  expectInvalid({ adapter, onError: "console" });
  expectInvalid({ adapter, onDiagnostic: {} });
  expect(observe).not.toHaveBeenCalled();
});

test("a throwing option or adapter getter is refused with its cause", () => {
  const failure = new Error("getter failed");

  const options = {
    get adapter(): LifecycleAdapter {
      throw failure;
    },
  };

  const hostile: PulseOptions = {
    adapter: {
      name: "hostile",
      get observe(): LifecycleAdapter["observe"] {
        throw failure;
      },
    },
  };

  expect(() => readPulseOptions(options)).toThrow(
    expect.objectContaining({ code: "INVALID_OPTIONS", cause: failure }),
  );
  expect(() => readPulseOptions(hostile)).toThrow(
    expect.objectContaining({ code: "INVALID_OPTIONS", cause: failure }),
  );
});

test("absent callbacks default, and an explicit undefined counts as absent", () => {
  const { host } = readPulseOptions({ adapter });

  expect(host).toEqual({
    adapter: { name: "test" },
    now: Date.now,
    onError: null,
    onDiagnostic: null,
  });
  expect(Object.isFrozen(host.adapter)).toBe(true);

  const withUndefined = { adapter, now: undefined };
  // @ts-expect-error exactOptionalPropertyTypes forbids it, but JavaScript can pass it.
  const read = readPulseOptions(withUndefined);

  expect(read.host.now).toBe(Date.now);
});

test("fields are read once, and the adapter method keeps its receiver", () => {
  const custom = {
    name: "custom",
    cleanup: () => {},
    observe(this: { cleanup: () => void }) {
      return this.cleanup;
    },
  };

  const { observe } = readPulseOptions({ adapter: custom });

  custom.name = "renamed";

  custom.observe = () => () => {};

  expect(observe({ next: () => {}, error: () => {} })).toBe(custom.cleanup);
  expect(readPulseOptions({ adapter: custom }).host.adapter.name).toBe(
    "renamed",
  );
});
