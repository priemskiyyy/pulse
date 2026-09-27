# Getting help

Start with the [package readme](packages/pulse/README.md) and [the documentation](docs/index.md).

For a bug report, include:

- The smallest example that reproduces the issue, ideally over the mock adapter from `@priemskiyyy/pulse/testing`.
- The Pulse version, the adapter, and the runtime: the browser and its version, or React Native, Expo, iOS or Android and their versions.
- The raw platform signals in the order they arrived (`visibilitychange`, `focus`, `pagehide`, or AppState `change`, `focus`, `blur` with their values) next to the `onDiagnostic` records.
- Whether it happens before `start()`, during the first delivery, or after `dispose()`.

Use [GitHub issues](https://github.com/priemskiyyy/pulse/issues) for reproducible bugs and feature requests. A lifecycle trace can reveal activity patterns, so share only what the report needs.

See [CONTRIBUTING.md](CONTRIBUTING.md) to run the test suites or propose a change.
