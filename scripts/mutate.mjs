// Mutation checks require a green baseline and restore every changed file.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = "packages/pulse/src";

// Each mutant weakens one rule the tests must defend. A survivor is either a
// missing test or dead code.
const MUTANTS = [
  {
    file: `${source}/utils/internal/commit/reduceObservation.ts`,
    find: "const usableTimestamp = rolledBack ? null : timestamp;",
    replace: "const usableTimestamp = timestamp;",
    describes: "a backward clock still timing an away interval",
  },
  {
    file: `${source}/utils/internal/commit/reduceObservation.ts`,
    find: "const departure = usableTimestamp === null ? null : timeline.departure;",
    replace: "const departure = timeline.departure;",
    describes: "a failed sample keeping an armed departure",
  },
  {
    file: `${source}/utils/internal/commit/reduceObservation.ts`,
    find: "  if (!Number.isFinite(away)) {",
    replace: "  if (false) {",
    describes: "an overflowing away time published as Infinity",
  },
  {
    file: `${source}/utils/internal/intake/readObservation.ts`,
    find: "  if (state === null) {",
    replace: "  if (state === undefined) {",
    describes: "background with interaction accepted as a state",
  },
  {
    file: `${source}/utils/internal/intake/sampleClock.ts`,
    find: "  if (!Number.isFinite(timestamp)) {",
    replace: "  if (false) {",
    describes: "a NaN clock sample published",
  },
  {
    file: `${source}/utils/Pulse.ts`,
    find: "    if (this.#draining) {",
    replace: "    if (false) {",
    describes: "a reentrant observation superseding the current commit",
  },
  {
    file: `${source}/utils/Pulse.ts`,
    find: "const registrations = [...registry];",
    replace: "const registrations = registry;",
    describes: "a listener added during a commit hearing that commit",
  },
  {
    file: `${source}/utils/Pulse.ts`,
    find: "    if (this.#isDisposed()) {\n      this.#runCleanup(host, cleanup);",
    replace: "    if (false) {\n      this.#runCleanup(host, cleanup);",
    describes: "a dispose during setup leaving the adapter observed",
  },
  {
    file: `${source}/utils/Pulse.ts`,
    find: "    if (!available) {",
    replace: "    if (false) {",
    describes: "an unavailable adapter observed anyway",
  },
  {
    file: `${source}/adapters/browser/browser.ts`,
    find: "      if (sampled !== generation) {",
    replace: "      if (false) {",
    describes: "a stale document sample overwriting a newer event",
  },
  {
    file: `${source}/adapters/browser/browser.ts`,
    find: "      if (event.target !== targetWindow) {",
    replace: "      if (event.target === null) {",
    describes: "focus moving between controls resampling the page",
  },
  {
    file: `${source}/adapters/browser/browser.ts`,
    find: "      const { state, errors } = latched\n        ? { state: LIFECYCLE_STATES.background.unavailable, errors: [] }\n        : sampleDocument(targetDocument);",
    replace: "      const { state, errors } = sampleDocument(targetDocument);",
    describes: "resume or focus ending the pagehide latch",
  },
  {
    file: `${source}/adapters/browser/utils/sampleDocument.ts`,
    find: "  if (readPrerendering(targetDocument, errors)) {",
    replace: "  if (false) {",
    describes: "a prerendering page reported as foreground",
  },
  {
    file: `${source}/utils/internal/cleanup/removeAll.ts`,
    find: "    try {\n      remove();\n    } catch (error) {\n      failures.push(error);\n    }",
    replace: "    remove();",
    describes: "a throwing removal stopping the ones after it",
  },
  {
    file: `${source}/adapters/browser/browser.ts`,
    find: "      rollBack(removals, error);",
    replace: "      throw error;",
    describes: "a failed browser setup leaving its listeners attached",
  },
  {
    file: `${source}/adapters/react-native/reactNative.ts`,
    find: "      rollBack(removals, error);",
    replace: "      throw error;",
    describes: "a failed native setup leaving its subscriptions attached",
  },
  {
    file: `${source}/utils/Pulse.ts`,
    find: "    try {\n      available = adapter.available();\n    } catch (error) {\n      throw this.#failStart(host, error);\n    }",
    replace: "    available = adapter.available();",
    describes: "a throwing availability probe escaping as a raw error",
  },
  {
    file: `${source}/adapters/react-native/reactNative.ts`,
    find: "      if (next === classification) {",
    replace: "      if (false) {",
    describes: "a duplicate background erasing focus for the next active",
  },
  {
    file: `${source}/adapters/react-native/reactNative.ts`,
    find: '      return next === "UNKNOWN";',
    replace: "      return false;",
    describes: "Android focus evidence crossing an unknown state",
  },
  {
    file: `${source}/adapters/react-native/reactNative.ts`,
    find: "    if (!receivedChange) {",
    replace: "    if (true) {",
    describes: "a stale AppState baseline overwriting a change",
  },
  {
    file: `${source}/adapters/react-native/reactNative.ts`,
    find: '      if (platform === "android") {\n        listen("focus"',
    replace: '      if (true) {\n        listen("focus"',
    describes: "iOS registering Android-only focus listeners",
  },
  {
    file: `${source}/adapters/react-native/utils/constants/classifications.ts`,
    find: '  inactive: "UNKNOWN",',
    replace: '  inactive: "INACTIVE",',
    describes: "Android inactive treated as the iOS interruption",
  },
  {
    file: `${source}/react/useLifecycle.ts`,
    find: "    getServerSnapshot,",
    replace: "    source.state.get,",
    describes: "hydration reading the live client state",
  },
];

const countFailures = (report) => {
  try {
    return JSON.parse(report).numFailedTests;
  } catch {
    return -1;
  }
};

const failingTests = () => {
  try {
    return countFailures(
      execFileSync(
        "node_modules/.bin/vitest",
        ["run", "--project", "pulse", "--reporter", "json"],
        { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      ),
    );
  } catch (error) {
    // A caught mutant exits non-zero, so the report on stdout still decides.
    return countFailures(String(error.stdout ?? ""));
  }
};

if (failingTests() !== 0) {
  console.error(
    "The baseline is not green; a mutation run against it proves nothing.",
  );
  process.exit(1);
}

console.log("Baseline green. Running mutants.\n");

const survivors = [];

for (const mutant of MUTANTS) {
  const path = new URL(mutant.file, `file://${root}`);
  const original = readFileSync(path, "utf8");

  if (!original.includes(mutant.find)) {
    console.error(
      `Mutant is stale, its target text is gone: ${mutant.describes}`,
    );
    process.exit(1);
  }

  try {
    writeFileSync(path, original.replace(mutant.find, mutant.replace));

    const failed = failingTests();

    if (failed > 0) {
      console.log(`caught   ${mutant.describes} (${failed} tests went red)`);
      continue;
    }

    survivors.push(mutant.describes);
    console.log(`SURVIVED ${mutant.describes}`);
  } finally {
    writeFileSync(path, original);
  }
}

console.log(
  `\n${MUTANTS.length - survivors.length} of ${MUTANTS.length} mutants caught.`,
);

if (survivors.length > 0) {
  console.error(
    `\nSurvivors, each a missing test or dead code:\n  ${survivors.join("\n  ")}`,
  );
  process.exit(1);
}
