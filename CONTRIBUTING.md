# Contributing

Use Node 22.18 or later and the pnpm version pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` builds the package, type checks it (the core also without DOM or Node types), lints it, proves the lint rules with probes, checks formatting and runs the unit tests. `pnpm check:release` adds the packed-package check, the size budgets and the release metadata.

## Layout

- `packages/pulse/src/index.ts`, `browser.ts`, `react-native.ts`, `react.ts` and `testing.ts` are the five entry points. They only re-export, and `src/index.test.ts` pins what each one exports.
- `src/types/` holds one public type per file; `src/types/internal/` the ones no entry exports.
- `src/utils/` holds the core: `Pulse.ts`, `PulseError.ts`, `constants/` and `internal/` for the intake, the reducer and error reporting.
- `src/adapters/<name>/` holds one adapter: its factory, its tests and fixture, and its own `types/`, `utils/` and `utils/constants/`.
- `src/react/` holds the hook, `src/testing/` the mock adapter, the test clock and the conformance suite.
- `*.contracts.ts` files are type checked and never run: they pin the public types, with `@ts-expect-error` negatives.

## Code

The rules are in [AGENTS.md](AGENTS.md) and enforced by `eslint.config.js`. In short: types before runtime checks, guard clauses instead of compound conditions, a helper with one caller inlined, no `interface`, `enum`, `switch`, `any`, `as`, `!`, `void`, `readonly` or relative imports, and no import across platforms: the core imports no React, React Native, DOM global or test runner, and nothing schedules a timer.

## Adapters

An adapter is a plain `{ name, available, observe }`. `available()` probes the host synchronously; `observe` registers first, then reports a complete snapshot, and answers a synchronous cleanup that removes only its own subscriptions. It never imports its platform: the application passes it in. Run `testLifecycleAdapter` from `@priemskiyyy/pulse/testing` against a harness over a fake or real host.

## Testing

Tests sit beside the source as `<Source>.test.ts`, as flat `test()` calls named for the invariant, with the spec's scenario ID (`C-`, `B-`, `N-`, `R-`) when there is one. Watch a new test fail before trusting it: break the code on purpose. Interleavings are driven by reentrancy and a manual clock, never by sleeping.

## Documentation

Pages under `docs/` start with a small working example, qualify every guarantee with the condition that breaks it, and use relative links. No em dashes, no agent names, no generated-by footers.
