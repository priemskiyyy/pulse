import type { BackgroundEvent } from "src/types/BackgroundEvent";
import type { ForegroundEvent } from "src/types/ForegroundEvent";
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

// Each call is its own registration, so the same function can be registered twice.
type Registration<TArgs extends unknown[]> = {
  listener: (...args: TArgs) => void;
};

type Registry<TArgs extends unknown[]> = Set<Registration<TArgs>>;

type TransitionRegistries = {
  [TType in keyof LifecycleEvents]: Registry<[LifecycleEvents[TType]]>;
};

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
  #stateListeners: Registry<[]> = new Set();
  #transitionListeners: TransitionRegistries = {
    foreground: new Set(),
    background: new Set(),
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

      return this.#register(this.#stateListeners, listener);
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
        if (this.#getLiveOwnership(token) === null) {
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
      // A dispose during setup already cleared everything and stays terminal.
      if (!this.#isDisposed()) {
        this.#ownership = { state: "FAILED" };
        this.#queue = [];
        this.#clearListeners();
      }

      throw new PulseError({
        code: "START_FAILED",
        message: `The ${host.adapter.name} adapter's setup threw.`,
        cause: error,
      });
    }

    if (this.#isDisposed()) {
      this.#runCleanup(host, cleanup);

      return;
    }

    this.#ownership = { state: "RUNNING", token, host, cleanup };
    // Input sent from the started diagnostic waits for the drain below instead of committing inside it.
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

    return this.#register(this.#transitionListeners[type], listener);
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

  #register<TArgs extends unknown[]>(
    registry: Registry<TArgs>,
    listener: (...args: TArgs) => void,
  ) {
    const registration: Registration<TArgs> = { listener };

    registry.add(registration);

    return () => {
      registry.delete(registration);
    };
  }

  #clearListeners() {
    this.#stateListeners.clear();
    this.#transitionListeners.foreground.clear();
    this.#transitionListeners.background.clear();
  }

  #getLiveOwnership(token: object) {
    const ownership = this.#ownership;

    if (ownership.state === "CREATED") {
      return null;
    }

    if (ownership.state === "FAILED") {
      return null;
    }

    if (ownership.state === "DISPOSED") {
      return null;
    }

    if (ownership.token !== token) {
      return null;
    }

    return ownership;
  }

  #accept(token: object, state: LifecycleState) {
    const ownership = this.#getLiveOwnership(token);

    if (ownership === null) {
      return;
    }

    const observation = readObservation(state);
    const sample = sampleClock(ownership.host.now);
    const reports: Report[] = [];

    if (sample.error !== null) {
      reports.push({ error: sample.error, origin: "clock" });
    }

    if (observation.error !== null) {
      reports.push({ error: observation.error, origin: "observation" });
    }

    this.#queue.push({
      kind: "observation",
      state: observation.state,
      timestamp: sample.timestamp,
      reports,
    });

    this.#drain();
  }

  #drain() {
    if (this.#draining) {
      return;
    }

    const ownership = this.#ownership;

    if (ownership.state !== "RUNNING") {
      return;
    }

    this.#draining = true;

    try {
      let intake = this.#queue.shift();

      // Disposal empties the queue, so a dispose from any callback also ends this loop.
      while (intake !== undefined) {
        this.#process(ownership.host, intake);
        intake = this.#queue.shift();
      }
    } finally {
      this.#draining = false;
    }
  }

  #process(host: PulseHost, intake: Intake) {
    if (intake.kind === "error") {
      this.#report(host, [{ error: intake.error, origin: "adapter" }]);

      return;
    }

    const reduction = reduceObservation(this.#timeline, intake);

    this.#timeline = reduction.timeline;

    const { reports } = intake;

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
    const notifyState = this.#capture(
      this.#stateListeners,
      [],
      "state-listener",
    );

    const notifyTransition = this.#captureTransition(event);

    notifyState(reports);
    notifyTransition(reports);

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

  #captureTransition(
    event: ForegroundEvent | BackgroundEvent | null,
  ): (reports: Report[]) => void {
    if (event === null) {
      return () => {};
    }

    if (event.type === "foreground") {
      return this.#capture(
        this.#transitionListeners.foreground,
        [event],
        "transition-listener",
      );
    }

    return this.#capture(
      this.#transitionListeners.background,
      [event],
      "transition-listener",
    );
  }

  #capture<TArgs extends unknown[]>(
    registry: Registry<TArgs>,
    args: TArgs,
    origin: PulseErrorOrigin,
  ) {
    const registrations = [...registry];

    return (reports: Report[]) => {
      for (const registration of registrations) {
        // Disposal clears the registries, so it also skips every remaining turn.
        if (!registry.has(registration)) {
          continue;
        }

        try {
          registration.listener(...args);
        } catch (error) {
          reports.push({ error, origin });
        }
      }
    };
  }

  #getErrorContext(host: PulseHost, origin: PulseErrorOrigin) {
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

      reportError(host, error, this.#getErrorContext(host, origin));
    }
  }

  #diagnose(host: PulseHost, createDiagnostic: () => PulseDiagnostic) {
    const { onDiagnostic } = host;

    if (onDiagnostic === null) {
      return;
    }

    if (!this.#isRunning()) {
      return;
    }

    try {
      onDiagnostic(Object.freeze(createDiagnostic()));
    } catch (error) {
      if (this.#isRunning()) {
        reportError(host, error, this.#getErrorContext(host, "diagnostic"));
      }
    }
  }

  #runCleanup(host: PulseHost, cleanup: () => void) {
    try {
      cleanup();
    } catch (error) {
      reportError(host, error, this.#getErrorContext(host, "cleanup"));
    }
  }
}
