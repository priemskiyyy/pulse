import type { Intake, Report } from "src/types/internal/Intake";
import type { Ownership } from "src/types/internal/Ownership";
import type { PulseHost } from "src/types/internal/PulseHost";
import type { Timeline } from "src/types/internal/Timeline";
import type { LifecycleEvents } from "src/types/LifecycleEvents";
import type { LifecycleObserver } from "src/types/LifecycleObserver";
import type { LifecycleState } from "src/types/LifecycleState";
import type { ObservableValue } from "src/types/ObservableValue";
import type { PulseDiagnostic } from "src/types/PulseDiagnostic";
import type { PulseErrorOrigin } from "src/types/PulseErrorOrigin";
import type { PulseOptions } from "src/types/PulseOptions";
import { UNKNOWN_LIFECYCLE_STATE } from "src/utils/constants/states";
import { reduceObservation } from "src/utils/internal/commit/reduceObservation";
import { readObservation } from "src/utils/internal/intake/readObservation";
import { sampleClock } from "src/utils/internal/intake/sampleClock";
import { reportError } from "src/utils/internal/reporting/reportError";
import { PulseError } from "src/utils/PulseError";

type Registration = { listener: unknown };

const INITIAL_TIMELINE: Timeline = Object.freeze({
  state: UNKNOWN_LIFECYCLE_STATE,
  sequence: 0,
  lastSample: null,
  departure: null,
});

const createDisposedError = () =>
  new PulseError({
    code: "DISPOSED",
    message: "This Pulse was disposed. Create a new one to observe again.",
  });

const createFailedError = () =>
  new PulseError({
    code: "FAILED_INSTANCE",
    message: "This Pulse failed to start. Create a new one to try again.",
  });

/**
 * One application-owned observation of a host's lifecycle: an immutable
 * `phase` and `interaction` snapshot, and deduplicated `foreground` and
 * `background` transitions. Constructing it observes nothing; `start()` begins,
 * unless the adapter is unavailable, and `dispose()` ends it for good.
 *
 * @example
 * ```ts
 * const pulse = new Pulse({ adapter: browser() });
 *
 * pulse.on("foreground", (event) => console.log(event.observedAway));
 * pulse.start();
 * ```
 */
export class Pulse {
  #ownership: Ownership;
  #timeline = INITIAL_TIMELINE;
  #queue: Intake[] = [];
  #draining = false;
  #listeners = {
    state: new Set<Registration>(),
    foreground: new Set<Registration>(),
    background: new Set<Registration>(),
  };

  constructor({
    adapter,
    now = Date.now,
    onError,
    onDiagnostic,
  }: PulseOptions) {
    this.#ownership = {
      state: "CREATED",
      adapter,
      host: {
        adapter: Object.freeze({ name: adapter.name }),
        now,
        onError: onError ?? null,
        onDiagnostic: onDiagnostic ?? null,
      },
    };
  }

  /**
   * The current snapshot and its change notifications. `get` answers the same
   * frozen object until the next commit, and neither method reads the host,
   * samples the clock or starts anything; both work detached.
   *
   * @example
   * ```ts
   * const stop = pulse.state.subscribe(() => {
   *   const { phase, interaction } = pulse.state.get();
   * });
   * ```
   */
  state: ObservableValue<LifecycleState> = Object.freeze({
    get: () => this.#timeline.state,
    subscribe: (listener: () => void) => {
      this.#assertUsable();

      return this.#register("state", listener);
    },
  });

  /**
   * Begins the adapter's observation, once. A repeat is a no-op, a failed
   * setup throws `START_FAILED`, and a known state may arrive later.
   *
   * @example
   * ```ts
   * pulse.start();
   * ```
   */
  start = () => {
    const ownership = this.#ownership;

    if (ownership.state === "DISPOSED") {
      throw createDisposedError();
    }

    if (ownership.state === "FAILED") {
      throw createFailedError();
    }

    if (ownership.state !== "CREATED") {
      return;
    }

    const { adapter, host } = ownership;

    // An unavailable host, such as a server render, is observed as unknown rather than as a failure.
    if (!adapter.available()) {
      this.#ownership = {
        state: "RUNNING",
        token: {},
        host,
        cleanup: () => {},
      };
      this.#diagnose(host, () => ({
        type: "unavailable",
        adapter: host.adapter,
      }));

      return;
    }

    const token = {};

    this.#ownership = { state: "STARTING", token, host };

    const observer: LifecycleObserver = Object.freeze({
      next: (state: LifecycleState) => this.#accept(token, state),
      error: (error: unknown) => {
        if (this.#getLive(token) === null) {
          return;
        }

        this.#queue.push({ kind: "error", error });
        this.#drain();
      },
    });

    let cleanup: () => void;

    try {
      cleanup = adapter.observe(observer);
    } catch (error) {
      throw this.#fail(
        new PulseError({
          code: "START_FAILED",
          message: `The ${host.adapter.name} adapter's setup threw.`,
          cause: error,
        }),
      );
    }

    if (this.#isDisposed()) {
      this.#runCleanup(host, cleanup);

      return;
    }

    this.#ownership = { state: "RUNNING", token, host, cleanup };
    this.#draining = true;

    try {
      this.#diagnose(host, () => ({ type: "started", adapter: host.adapter }));
    } finally {
      this.#draining = false;
    }

    this.#drain();
  };

  /**
   * Listens to one transition. Events never replay, a listener added during a
   * commit starts with the next one, and each call is its own registration.
   *
   * @example
   * ```ts
   * const stop = pulse.on("background", (event) => console.log(event.sequence));
   * ```
   */
  on = <TType extends keyof LifecycleEvents>(
    type: TType,
    listener: (event: LifecycleEvents[TType]) => void,
  ): (() => void) => {
    this.#assertUsable();

    return this.#register(type, listener);
  };

  /**
   * Ends the observation for good: queued input is dropped, no callback runs
   * afterwards, and the last snapshot stays readable. It reports only a cleanup
   * failure, synchronously; later calls do nothing.
   *
   * @example
   * ```ts
   * pulse.dispose();
   * ```
   */
  dispose = () => {
    const ownership = this.#ownership;

    if (ownership.state === "DISPOSED") {
      return;
    }

    this.#ownership = { state: "DISPOSED" };
    this.#queue = [];
    this.#clearListeners();

    if (ownership.state !== "RUNNING") {
      return;
    }

    this.#runCleanup(ownership.host, ownership.cleanup);
  };

  #isDisposed() {
    return this.#ownership.state === "DISPOSED";
  }

  #isRunning() {
    return this.#ownership.state === "RUNNING";
  }

  #assertUsable() {
    const { state } = this.#ownership;

    if (state === "DISPOSED") {
      throw createDisposedError();
    }

    if (state === "FAILED") {
      throw createFailedError();
    }
  }

  #register(kind: "state" | keyof LifecycleEvents, listener: unknown) {
    const registry = this.#listeners[kind];
    const registration: Registration = { listener };

    registry.add(registration);

    return () => {
      registry.delete(registration);
    };
  }

  #clearListeners() {
    this.#listeners.state.clear();
    this.#listeners.foreground.clear();
    this.#listeners.background.clear();
  }

  #fail(error: PulseError) {
    if (!this.#isDisposed()) {
      this.#ownership = { state: "FAILED" };
    }

    this.#queue = [];
    this.#clearListeners();

    return error;
  }

  #getLive(token: object) {
    const ownership = this.#ownership;

    if (ownership.state !== "STARTING" && ownership.state !== "RUNNING") {
      return null;
    }

    return ownership.token === token ? ownership : null;
  }

  #accept(token: object, value: LifecycleState) {
    const ownership = this.#getLive(token);

    if (ownership === null) {
      return;
    }

    const read = readObservation(value);
    const sample = sampleClock(ownership.host.now);
    const reports: Report[] = [];

    if (sample.error !== null) {
      reports.push({ error: sample.error, origin: "clock" });
    }

    if (read.error !== null) {
      reports.push({ error: read.error, origin: "observation" });
    }

    this.#queue.push({
      kind: "observation",
      state: read.state,
      timestamp: sample.timestamp,
      reports,
    });

    this.#drain();
  }

  #drain() {
    if (this.#draining || !this.#isRunning()) {
      return;
    }

    this.#draining = true;

    try {
      let intake = this.#queue.shift();

      while (intake !== undefined) {
        this.#process(intake);
        intake = this.#queue.shift();
      }
    } finally {
      this.#draining = false;
    }
  }

  #process(intake: Intake) {
    const ownership = this.#ownership;

    if (ownership.state !== "RUNNING") {
      return;
    }

    const { host } = ownership;

    if (intake.kind === "error") {
      this.#report(host, [{ error: intake.error, origin: "adapter" }]);

      return;
    }

    const reduction = reduceObservation(this.#timeline, intake);

    this.#timeline = reduction.timeline;

    const reports = [...intake.reports];

    if (reduction.rolledBack) {
      reports.push({
        error: new PulseError({
          code: "INVALID_CLOCK",
          message:
            "The clock moved backwards, so no away time is paired across it.",
        }),
        origin: "clock",
      });
    }

    const { commit, event } = reduction;
    const { sequence } = reduction.timeline;

    if (commit === null) {
      this.#report(host, reports);
      this.#diagnose(host, () => ({
        type: "duplicate",
        sequence,
        state: reduction.timeline.state,
      }));

      return;
    }

    // Both groups are captured before the first callback: a registration added now waits for the next commit.
    const eventRegistrations =
      event === null ? [] : [...this.#listeners[event.type]];

    // Disposal clears the registries, so it also skips every remaining turn.
    for (const registration of [...this.#listeners.state]) {
      const { listener } = registration;

      if (
        !this.#listeners.state.has(registration) ||
        typeof listener !== "function"
      ) {
        continue;
      }

      try {
        listener();
      } catch (error) {
        reports.push({ error, origin: "state-listener" });
      }
    }

    if (event !== null) {
      const registry = this.#listeners[event.type];

      for (const registration of eventRegistrations) {
        const { listener } = registration;

        if (!registry.has(registration) || typeof listener !== "function") {
          continue;
        }

        try {
          listener(event);
        } catch (error) {
          reports.push({ error, origin: "transition-listener" });
        }
      }
    }

    this.#report(host, reports);
    this.#diagnose(host, () => ({
      type: "commit",
      sequence,
      from: commit.from,
      to: commit.to,
      observedAt: intake.timestamp,
      transition: event === null ? null : event.type,
    }));
  }

  #getContext(host: PulseHost, origin: PulseErrorOrigin) {
    return Object.freeze({
      origin,
      adapter: host.adapter,
      sequence: this.#timeline.sequence,
    });
  }

  #report(host: PulseHost, reports: Report[]) {
    for (const { error, origin } of reports) {
      if (!this.#isRunning()) {
        return;
      }

      reportError(host, error, this.#getContext(host, origin));
    }
  }

  #diagnose(host: PulseHost, build: () => PulseDiagnostic) {
    const { onDiagnostic } = host;

    if (onDiagnostic === null || !this.#isRunning()) {
      return;
    }

    try {
      onDiagnostic(Object.freeze(build()));
    } catch (error) {
      if (this.#isRunning()) {
        reportError(host, error, this.#getContext(host, "diagnostic"));
      }
    }
  }

  #runCleanup(host: PulseHost, cleanup: () => void) {
    try {
      cleanup();
    } catch (error) {
      reportError(host, error, this.#getContext(host, "cleanup"));
    }
  }
}
