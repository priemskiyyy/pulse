# Contributing

Use Node 22.18 or later and the pnpm version pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` builds the package, type checks it (the core also without DOM or Node types), lints it, proves the lint rules with probes, checks formatting and runs the unit tests. `pnpm check:release` adds the docs site build, the docs and snippet checks, the packed-package check, the size budgets, the release metadata and the mutation run. `pnpm test:browser` runs both labs in Chromium with Playwright.

## Layout

- `packages/pulse/src/index.ts`, `browser.ts`, `react-native.ts` and `testing.ts` are the core entry points. They only re-export, and `src/index.test.ts` pins what each one exports.
- `src/types/` holds one public type per file; `src/types/internal/` the ones no entry exports.
- `src/utils/` holds the core: `Pulse.ts`, `PulseError.ts`, `constants/` and `internal/` for the intake, the reducer and error reporting.
- `src/adapters/<name>/` holds one adapter: its factory, its tests and fixture, and its own `types/`, `utils/` and `utils/constants/`.
- `packages/react` is `@priemskiyyy/pulse-react` `packages/solid` is `@priemskiyyy/pulse-solid` and `packages/vue` is `@priemskiyyy/pulse-vue` and `packages/svelte` is `@priemskiyyy/pulse-svelte`: `context/` holds the provider, `hooks/`, `primitives/`, `composables/` or `utilities/` the rest. The Svelte binding imports by relative path, since `svelte-package` rewrites no aliases. `src/testing/` the mock adapter, the test clock and the conformance suite.
- `*.contracts.ts` files are type checked and never run: they pin the public types, with `@ts-expect-error` negatives.
- `examples/shared` holds the lab both example apps share and the compiled integration recipes; `examples/react` and `examples/expo` the apps for exercising real hosts.

## Code

The rules are in [AGENTS.md](AGENTS.md) and enforced by `eslint.config.js`. In short: types before runtime checks, guard clauses instead of compound conditions, a helper with one caller inlined unless it names a whole stage, no `interface`, `enum`, `switch`, `any`, `as`, `!`, `void`, `readonly` or relative imports, and no import across platforms: the core imports no React, React Native, DOM global or test runner, and nothing schedules a timer.

## Adapters

An adapter is a plain `{ name, available, observe }` that never imports its platform. The contract and the conformance suite are in [custom adapters](docs/custom-adapters.md).

## Testing

Tests sit beside the source as `<Source>.test.ts`, as flat `test()` calls named for the invariant, with the spec's scenario ID (`C-`, `B-`, `N-`, `R-`) when there is one. Watch a new test fail before trusting it: break the code on purpose. Interleavings are driven by reentrancy and a manual clock, never by sleeping.

## Documentation

Pages under `docs/` start with a small working example, qualify every guarantee with the condition that breaks it, and use relative links. No em dashes, no agent names, no generated-by footers.
