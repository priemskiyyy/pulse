import { JSDOM } from "jsdom";
import { vi } from "vitest";

type Registration = {
  target: "window" | "document";
  type: string;
  listener: EventListenerOrEventListenerObject | null;
  capture: boolean;
};

// A real jsdom page, from another realm, whose visibility and focus the test sets.
export const createPage = ({
  visibility = "visible",
  focused = true,
}: { visibility?: unknown; focused?: boolean } = {}) => {
  const { window } = new JSDOM(
    '<!doctype html><input id="first" /><input id="second" /><iframe></iframe>',
    { pretendToBeVisual: true },
  );

  const { document } = window;

  const page: {
    visibility: unknown;
    focused: boolean;
    prerendering: boolean | null;
  } = { visibility, focused, prerendering: null };

  Object.defineProperties(document, {
    visibilityState: { configurable: true, get: () => page.visibility },
    hasFocus: { configurable: true, value: () => page.focused },
    prerendering: { configurable: true, get: () => page.prerendering },
  });

  const registrations: Registration[] = [];

  // A test sets these to make the host refuse one registration or removal.
  const faults: {
    add: ((type: string) => void) | null;
    remove: ((type: string) => void) | null;
  } = { add: null, remove: null };

  const track = (name: Registration["target"], target: EventTarget) => {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);

    vi.spyOn(target, "addEventListener").mockImplementation(
      (type, listener, options) => {
        faults.add?.(type);
        registrations.push({
          target: name,
          type,
          listener,
          capture: options === true,
        });
        add(type, listener, options);
      },
    );

    vi.spyOn(target, "removeEventListener").mockImplementation(
      (type, listener, options) => {
        faults.remove?.(type);

        const index = registrations.findIndex(
          (registration) =>
            registration.target === name &&
            registration.type === type &&
            registration.listener === listener &&
            registration.capture === (options === true),
        );

        if (index >= 0) {
          registrations.splice(index, 1);
        }

        remove(type, listener, options);
      },
    );
  };

  track("window", window);
  track("document", document);

  const fire = (target: EventTarget, type: string) =>
    target.dispatchEvent(new window.Event(type));

  return {
    window,
    document,
    page,
    registrations,
    faults,
    fire,
    hide: () => {
      page.visibility = "hidden";
      fire(document, "visibilitychange");
    },
    show: () => {
      page.visibility = "visible";
      fire(document, "visibilitychange");
    },
    blur: () => {
      page.focused = false;
      fire(window, "blur");
    },
    focus: () => {
      page.focused = true;
      fire(window, "focus");
    },
    pageHide: (persisted: boolean) =>
      window.dispatchEvent(
        new window.PageTransitionEvent("pagehide", { persisted }),
      ),
    pageShow: (persisted: boolean) =>
      window.dispatchEvent(
        new window.PageTransitionEvent("pageshow", { persisted }),
      ),
  };
};
