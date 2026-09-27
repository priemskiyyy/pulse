import type { BrowserOptions } from "src/adapters/browser/types/BrowserOptions";
import { sampleDocument } from "src/adapters/browser/utils/sampleDocument";
import type { LifecycleAdapter } from "src/types/LifecycleAdapter";
import { LIFECYCLE_STATES } from "src/utils/constants/states";

/**
 * Observes one document: visibility is the phase and `document.hasFocus()` the
 * interaction, with `pagehide` holding background until `pageshow`. It is
 * unavailable without a live document, such as on a server.
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
  available: () => {
    const targetWindow = target ?? globalThis.window;

    // A server render has no window.
    if (typeof targetWindow !== "object") {
      return false;
    }

    // A detached frame's window has no live document.
    return targetWindow.document?.defaultView === targetWindow;
  },
  observe: (observer) => {
    const targetWindow = target ?? globalThis.window;
    const targetDocument = targetWindow.document;

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

      const state = latched
        ? LIFECYCLE_STATES.background.unavailable
        : sampleDocument(targetDocument);

      if (closed) {
        return;
      }

      // An event handled while the getters ran has already published newer evidence.
      if (sampled !== generation) {
        return;
      }

      observer.next(state);
    };

    // Focus moving between elements reaches the window in its capture phase; only the window's own counts.
    const handleFocusChange = (event: Event) => {
      if (event.target !== targetWindow) {
        return;
      }

      publish();
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

    listen(targetDocument, "visibilitychange", publish);
    listen(targetWindow, "focus", handleFocusChange);
    listen(targetWindow, "blur", handleFocusChange);
    listen(targetWindow, "pagehide", handlePageHide);
    listen(targetWindow, "pageshow", handlePageShow);
    listen(targetDocument, "freeze", publish);
    listen(targetDocument, "resume", publish);
    listen(targetDocument, "prerenderingchange", publish);
    publish();

    return () => {
      if (closed) {
        return;
      }

      closed = true;

      for (const remove of removals) {
        remove();
      }
    };
  },
});
