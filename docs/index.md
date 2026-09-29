---
description: "Pulse gives an application one owned observation of its lifecycle on the web and in React Native: two fields, two transitions, and precise cleanup."
---

# Pulse

Application lifecycle state for TypeScript, React and React Native. One shared
observation, immutable snapshots, and deduplicated foreground/background events.

[Get started](getting-started.md) · [Try the lifecycle lab](https://priemskiyyy.github.io/pulse/demo/) · [View on GitHub](https://github.com/priemskiyyy/pulse)

::: info Verification
The runtime and packaged consumer are tested automatically; physical-device and
several browser lifecycle checks remain pending. See
[verification](verification.md).
:::

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { browser } from "@priemskiyyy/pulse/browser";

export const pulse = new Pulse({ adapter: browser() });

pulse.on("foreground", (event) => {
  console.log("Returned after", event.observedAway, "ms");
});
pulse.start();
```

One Pulse owns one observation of its host. It reports a `phase` and an `interaction` as frozen snapshots, and `foreground` and `background` transitions between known phases.

## The guarantee, and where it ends

Given the same ordered observations, clock samples and listener operations, Pulse produces the same snapshots and the same transitions. It does not promise that the platform reports every physical change, reports it at once, or gives JavaScript time to finish anything. A snapshot is the latest usable evidence under a documented mapping; `unknown` means there is none.

It is not a scheduler, an exit hook, a presence tracker or a security signal; see [what Pulse is not](https://github.com/priemskiyyy/pulse#what-pulse-is-not).

## Where to go next

- [Getting started](getting-started.md): ownership, `start()`, passive subscriptions and `dispose()`.
- [States and transitions](states-and-transitions.md): the seven states, what counts as a transition, and the away time.
- [Browser](browser.md) and [React Native](react-native.md): what each adapter observes, and what it cannot.
- [React](react.md): the hook, server rendering and hydration.
- [Custom adapters](custom-adapters.md), [recipes](recipes.md) and [testing](testing.md).
- [Verification](verification.md): what the tests prove, and what they do not.
- [Decisions](decisions.md): where Pulse departs from its specification, and why.
- [Architecture](internals/architecture.md): the commit order and the invariants.
