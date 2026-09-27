# Agent guide

Pulse is a small, typed application-lifecycle observation runtime for the web
and React Native. Its siblings are Silo, Simulcast, Switchboard, Perk, Flare
and Trace, and it follows their conventions. Before changing code, read
`CONTRIBUTING.md` for layout and style and the tests beside the file you touch.
`tasks/` is a local decision log that is not committed.

- The model: one `Pulse` per observed host over one adapter. Its state is two
  fields, `phase` and `interaction`, as interned frozen snapshots; its events
  are `foreground` and `background`, observed adjacent known phase changes and
  nothing else. The principles:
  1. Pulse reports what its source observed. It never decides what an
     application may run, and unknown is never turned into a known value.
  2. Constructing a Pulse does nothing, subscribing creates no demand, and
     `dispose()` is terminal. There is no restart and no adapter replacement.
  3. An adapter is a plain `{ name, available, observe }` over a host the
     application owns. `available()` is a cheap synchronous probe; when it is
     false, `start()` observes nothing and the state stays unknown. An adapter
     never imports its platform: React Native's `AppState` is passed in.
  4. Every input is delivered in order: reentrant observations queue behind
     the current commit instead of superseding it.
  5. Pulse schedules nothing: no timer, no polling, no debounce.
- One published package, `@priemskiyyy/pulse`, with the entry points `.`,
  `./browser`, `./react-native`, `./react` and `./testing`. ESLint keeps each
  entry to its own platform; `scripts/verify-lint-rules.mjs` proves it.
- Layout: the core in `src/types` and `src/utils`, each adapter in
  `src/adapters/<name>/` with its factory, tests and fixture beside it and its
  own `types/`, `utils/` and `utils/constants/`, the hook in `src/react`, the
  test helpers in `src/testing`. An entry file only re-exports.
- **Types before runtime checks.** What the types enforce is not checked again
  at runtime: no option or argument validation, no shape checks. Runtime code
  checks only what a type cannot say, such as background's interaction, a
  finite clock, a stale sample or a closed observation. Compile-time contracts
  live in `*.contracts.ts` files with `@ts-expect-error <reason>` negatives.
- **Code**: verbose and explicit. Guard clauses with early returns instead of
  compound conditions: split `a && b || c` into one `if` per rule, or into a
  small helper named for what it answers (`isRolledBack`). A helper with one
  caller is inlined unless it names a whole stage. `typeof x === "function"`
  only as a type bridge; handlers named `handle*`; exhaustive mappings as
  typed `Record` tables; internal state machines in `UPPER_CASE`; classes only
  for stateful owners with `#private` fields and arrow-field members; no
  default exports; no module-level mutable state; `src/...` imports.
- **ESLint** (Trace's rules): `type` over `interface`, no `enum`, `switch`,
  `any`, `as` (including `as const`), non-null `!`, `void` operator, `??=`,
  `||=`, `&&=`, `readonly` in any form, `export *`, relative imports, or
  re-exports outside entry files; `curly: all`; `no-else-return`; the
  blank-line rule. Published data is frozen at runtime instead.
- **Comments**: only why, in one line. Public exports carry a one or two
  sentence JSDoc with an `@example`.
- **Tests**: `<Source>.test.ts` beside the source, or a behavior file such as
  `delivery.test.ts` beside it, flat `test()` calls named
  for the invariant, spec scenario IDs (`C-012`, `B-023`, `N-014`, `R-006`)
  in the name, `globals: false`, fixtures in `*.fixture.ts`. A new test is
  watched failing before it is trusted: break the code on purpose.
- **Prose**: no em dashes anywhere, no agent names, no generated-by footers
  or attribution trailers.
- Verify with `pnpm check` and read the output.
