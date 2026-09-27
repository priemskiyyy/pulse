import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { PulseHost } from "src/types/internal/PulseHost";
import type { PulseOptions } from "src/types/PulseOptions";
import { PulseError } from "src/utils/PulseError";

const createInvalid = (message: string, cause?: unknown) =>
  new PulseError({ code: "INVALID_OPTIONS", message, cause });

const readOptionFields = (options: PulseOptions) => {
  try {
    const { adapter, now, onError, onDiagnostic } = options;

    return { adapter, now, onError, onDiagnostic };
  } catch (error) {
    throw createInvalid("Reading the Pulse options threw.", error);
  }
};

const readAdapterFields = (adapter: PulseOptions["adapter"]) => {
  try {
    const { name, observe } = adapter;

    return { name, observe };
  } catch (error) {
    throw createInvalid("Reading the adapter threw.", error);
  }
};

const readCallback = <TCallback>(
  value: TCallback | undefined,
  name: string,
) => {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "function") {
    throw createInvalid(`${name} must be a function when it is given.`);
  }

  return value;
};

export const readPulseOptions = (options: PulseOptions) => {
  if (typeof options !== "object" || options === null) {
    throw createInvalid("Pulse needs an options object.");
  }

  const { adapter, now, onError, onDiagnostic } = readOptionFields(options);

  if (typeof adapter !== "object" || adapter === null) {
    throw createInvalid("adapter must be a lifecycle adapter object.");
  }

  const { name, observe } = readAdapterFields(adapter);

  if (typeof name !== "string" || name.length === 0) {
    throw createInvalid("adapter.name must be a nonempty string.");
  }

  if (typeof observe !== "function") {
    throw createInvalid("adapter.observe must be a function.");
  }

  const host: PulseHost = {
    adapter: Object.freeze({ name }),
    now: readCallback(now, "now") ?? Date.now,
    onError: readCallback(onError, "onError"),
    onDiagnostic: readCallback(onDiagnostic, "onDiagnostic"),
  };

  return {
    // The method is captured once and keeps its receiver: a custom adapter may use `this`.
    observe: (observer: LifecycleObserver): unknown =>
      observe.call(adapter, observer),
    host,
  };
};
