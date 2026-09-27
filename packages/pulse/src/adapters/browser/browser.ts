import type { BrowserOptions } from "src/adapters/browser/types/BrowserOptions";
import { BACKGROUND_STATE } from "src/adapters/browser/utils/constants/states";
import { sampleDocument } from "src/adapters/browser/utils/sampleDocument";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";

/**
 * Observes one document: visibility is the phase, `document.hasFocus()` the
 * interaction. A `pagehide` holds the phase at background until `pageshow`,
 * and a positively prerendering document is background. It registers no
 * unload, activity or timer listener, and creating it reads nothing.
 *
 * @example
 * ```ts
 * const pulse = new Pulse({ adapter: browser() });
 *
 * pulse.start();
 * ```
 */
export const browser = ({ target }: BrowserOptions = {}): LifecycleAdapter => ({
  name: "browser",
  observe: (observer) => {
    const targetWindow = target ?? globalThis.window;

    if (typeof targetWindow !== "object" || targetWindow === null) {
      throw new Error(
        "There is no window to observe. Start the browser adapter in a browser, or pass { target }.",
      );
    }

    const targetDocument = targetWindow.document;

    if (
      typeof targetDocument !== "object" ||
      targetDocument === null ||
      targetDocument.defaultView !== targetWindow
    ) {
      throw new Error("The target window has no live document to observe.");
    }

    let closed = false;
    let latched = false;
    let generation = 0;
    const removals: Array<() => void> = [];

    const publish = () => {
      if (closed) {
        return;
      }

      generation += 1;

      const sampled = generation;

      const { state, failures } = latched
        ? { state: BACKGROUND_STATE, failures: [] }
        : sampleDocument(targetDocument);

      // An event handled while the getters ran has already published newer evidence.
      if (closed || sampled !== generation) {
        return;
      }

      observer.next(state);

      for (const failure of failures) {
        observer.error(failure);
      }
    };

    // Focus moving between elements reaches the window in its capture phase; only the window's own counts.
    const handleFocusChange = (event: Event) => {
      if (event.target === targetWindow || event.target === targetDocument) {
        publish();
      }
    };

    const handlePageHide = () => {
      latched = true;
      publish();
    };

    const handlePageShow = () => {
      latched = false;
      publish();
    };

    const listen = (
      eventTarget: EventTarget,
      type: string,
      handler: (event: Event) => void,
    ) => {
      eventTarget.addEventListener(type, handler, true);
      removals.push(() => eventTarget.removeEventListener(type, handler, true));
    };

    const removeAll = () => {
      const failures: unknown[] = [];

      for (const remove of removals.reverse()) {
        try {
          remove();
        } catch (error) {
          failures.push(error);
        }
      }

      removals.length = 0;

      return failures;
    };

    try {
      listen(targetDocument, "visibilitychange", publish);
      listen(targetWindow, "focus", handleFocusChange);
      listen(targetWindow, "blur", handleFocusChange);
      listen(targetWindow, "pagehide", handlePageHide);
      listen(targetWindow, "pageshow", handlePageShow);
      listen(targetDocument, "freeze", publish);
      listen(targetDocument, "resume", publish);
      listen(targetDocument, "prerenderingchange", publish);
      publish();
    } catch (error) {
      closed = true;

      const failures = removeAll();

      if (failures.length > 0) {
        throw new AggregateError(
          [error, ...failures],
          "Observing the document failed, and so did removing its listeners.",
        );
      }

      throw error;
    }

    return () => {
      if (closed) {
        return;
      }

      closed = true;

      const failures = removeAll();

      if (failures.length > 0) {
        throw new AggregateError(
          failures,
          "Removing the document listeners failed.",
        );
      }
    };
  },
});
