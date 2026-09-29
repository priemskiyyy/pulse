import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = fileURLToPath(new URL("..", import.meta.url));
const directory = path.join(workspace, "packages/pulse");
const artifacts = path.join(workspace, ".artifacts");
const release = path.join(artifacts, "release");
const consumer = mkdtempSync(path.join(tmpdir(), "pulse-consumer-"));

const rootManifest = JSON.parse(
  readFileSync(path.join(workspace, "package.json"), "utf8"),
);

const manifest = JSON.parse(
  readFileSync(path.join(directory, "package.json"), "utf8"),
);

const run = (command, args, cwd = consumer) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 300_000,
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
      {
        cause: result.error,
      },
    );
  }

  return result.stdout;
};

const write = (name, content) =>
  writeFileSync(path.join(consumer, name), content);

const installed = path.join(consumer, "node_modules", manifest.name);

const readInstalled = (file) =>
  readFileSync(path.join(installed, file), "utf8");

// Every module an entry reaches through its relative imports, itself included.
const getGraph = (entry) => {
  const seen = new Set();
  const pending = [entry];

  while (pending.length > 0) {
    const file = pending.pop();

    if (seen.has(file)) {
      continue;
    }

    seen.add(file);

    for (const [, specifier] of readInstalled(file).matchAll(
      /from\s+"(\.\/[^"]+)"/g,
    )) {
      pending.push(path.posix.join(path.posix.dirname(file), specifier));
    }
  }

  return [...seen].map((file) => readInstalled(file)).join("\n");
};

// Anchored to a statement, so an import inside a JSDoc example does not count.
const importsPackage = (source, name) =>
  new RegExp(
    `^\\s*(?:import|export)[^\\n]*from\\s+"${name}(?:/[^"]*)?"|import\\("${name}`,
    "m",
  ).test(source);

// What each entry may import from outside the package, and nothing else.
const ENTRIES = {
  ".": { file: "dist/index.js", client: false, packages: [] },
  "./browser": { file: "dist/browser.js", client: false, packages: [] },
  "./react-native": {
    file: "dist/react-native.js",
    client: false,
    packages: [],
  },
  "./react": { file: "dist/react.js", client: true, packages: ["react"] },
  "./solid": { file: "dist/solid.js", client: false, packages: ["solid-js"] },
  "./vue": { file: "dist/vue.js", client: false, packages: ["vue"] },
  "./svelte": { file: "dist/svelte.js", client: false, packages: ["svelte"] },
  "./testing": { file: "dist/testing.js", client: false, packages: [] },
};

const RUNTIME_EXPORTS = {
  ".": ["Pulse", "PulseError", "UNKNOWN_LIFECYCLE_STATE"],
  "./browser": ["browser"],
  "./react-native": ["reactNative"],
  "./react": ["PulseProvider", "useLifecycle", "usePulse"],
  "./solid": ["PulseProvider", "useLifecycle", "usePulse"],
  "./vue": ["PulseProvider", "useLifecycle", "usePulse"],
  "./svelte": ["setPulseContext", "useLifecycle", "usePulse"],
  "./testing": ["createMockAdapter", "createTestClock", "testLifecycleAdapter"],
};

try {
  assert.deepEqual(
    Object.keys(manifest.exports),
    Object.keys(ENTRIES),
    "The export map changed.",
  );

  for (const [subpath, target] of Object.entries(manifest.exports)) {
    // React Native consumers run Jest, which needs a condition it can resolve.
    assert.deepEqual(
      Object.keys(target),
      ["types", "import", "default"],
      `${subpath} orders its conditions wrongly.`,
    );
    assert.equal(
      target.import,
      target.default,
      `${subpath} points import and default at different files.`,
    );
    assert.equal(
      `./${ENTRIES[subpath].file}`,
      target.import,
      `${subpath} points at the wrong file.`,
    );
  }

  process.stdout.write(run("pnpm", ["exec", "publint", directory], workspace));
  rmSync(release, { recursive: true, force: true });
  mkdirSync(artifacts, { recursive: true });

  const [packed] = JSON.parse(
    run(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--pack-destination", artifacts],
      directory,
    ),
  );

  const files = packed.files.map((file) => file.path);

  assert(files.includes("README.md"), "The package ships no README.");
  assert(files.includes("LICENSE"), "The package ships no LICENSE.");
  assert(
    files.every(
      (file) =>
        file.startsWith("dist/") ||
        ["README.md", "LICENSE", "package.json"].includes(file),
    ),
    `Unexpected packed files: ${files.join(", ")}`,
  );
  assert(
    !files.some((file) => /\.(test|fixture|contracts)\./.test(file)),
    "Test files were packed.",
  );

  const tarball = path.join(artifacts, packed.filename);
  const staged = path.join(release, packed.name);

  const checksum = createHash("sha256")
    .update(readFileSync(tarball))
    .digest("hex");

  // The publish workflow uploads exactly this tarball, checked against its sum.
  mkdirSync(staged, { recursive: true });
  copyFileSync(tarball, path.join(staged, packed.filename));
  writeFileSync(
    path.join(staged, "SHA256SUMS"),
    `${checksum}  ${packed.filename}\n`,
  );

  const pick = (names) =>
    Object.fromEntries(
      names.map((name) => [name, rootManifest.devDependencies[name]]),
    );

  write(
    "package.json",
    `${JSON.stringify({ name: "pulse-consumer", private: true, type: "module", dependencies: pick(["react", "react-dom", "@types/react", "solid-js", "vue", "svelte", "typescript"]) }, null, 2)}\n`,
  );
  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    tarball,
  ]);

  for (const [subpath, { file, client, packages }] of Object.entries(ENTRIES)) {
    const bundle = readInstalled(file);
    const graph = getGraph(file);

    assert.equal(
      bundle.startsWith('"use client";'),
      client,
      `${subpath} has the wrong "use client" state.`,
    );
    assert(
      !/^export default /m.test(graph),
      `${subpath} has a default export.`,
    );
    assert(!graph.includes('from "src/'), `${subpath} kept a source alias.`);

    for (const name of [
      "react",
      "react-dom",
      "react-native",
      "solid-js",
      "vue",
      "svelte",
      "vitest",
    ]) {
      assert.equal(
        importsPackage(graph, name),
        packages.includes(name),
        `${subpath} imports ${name} unexpectedly.`,
      );
    }
  }

  assert(
    !getGraph("dist/react-native.js").includes("visibilityState"),
    "The native entry reaches the browser adapter.",
  );
  assert(
    !getGraph("dist/browser.js").includes("AppState"),
    "The browser entry reaches the native adapter.",
  );
  assert(
    !getGraph("dist/browser.js").includes("createMockAdapter"),
    "The browser entry reaches the testing helpers.",
  );
  assert(
    !getGraph("dist/index.js").includes("addEventListener"),
    "The root entry reaches an adapter.",
  );

  // The core's declarations compile with no DOM and no Node types, under both resolutions.
  write(
    "neutral.ts",
    [
      'import { Pulse, UNKNOWN_LIFECYCLE_STATE, type LifecycleAdapter, type ForegroundEvent } from "@priemskiyyy/pulse";',
      'import { createMockAdapter, createTestClock, testLifecycleAdapter } from "@priemskiyyy/pulse/testing";',
      "",
      "const mock = createMockAdapter();",
      "const adapter: LifecycleAdapter = mock.adapter;",
      "const pulse = new Pulse({ adapter, now: createTestClock().now });",
      "",
      'pulse.on("foreground", (event: ForegroundEvent) => event.observedAway);',
      "export const state = pulse.state.get() === UNKNOWN_LIFECYCLE_STATE;",
      "export const suite = testLifecycleAdapter;",
      "",
      "// @ts-expect-error resume is not a transition.",
      'pulse.on("resume", () => {});',
      "",
    ].join("\n"),
  );

  write(
    "platforms.tsx",
    [
      'import { browser } from "@priemskiyyy/pulse/browser";',
      'import { useLifecycle } from "@priemskiyyy/pulse/react";',
      'import { reactNative, type AppStateLike } from "@priemskiyyy/pulse/react-native";',
      'import { useLifecycle as useSolidLifecycle } from "@priemskiyyy/pulse/solid";',
      'import { useLifecycle as useVueLifecycle } from "@priemskiyyy/pulse/vue";',
      'import { useLifecycle as useSvelteLifecycle } from "@priemskiyyy/pulse/svelte";',
      'import { Pulse } from "@priemskiyyy/pulse";',
      "",
      "declare const appState: AppStateLike;",
      "",
      "export const web = new Pulse({ adapter: browser() });",
      'export const native = new Pulse({ adapter: reactNative({ appState, platform: "ios" }) });',
      "export const Label = () => <span>{useLifecycle(web).phase}</span>;",
      "export const solidPhase = () => useSolidLifecycle(web)().phase;",
      "export const vuePhase = () => useVueLifecycle(web).value.phase;",
      "export const sveltePhase = () => useSvelteLifecycle(web).current.phase;",
      "",
    ].join("\n"),
  );

  const compile = (name, file, options) => {
    write(
      name,
      `${JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            noUncheckedIndexedAccess: true,
            exactOptionalPropertyTypes: true,
            target: "ES2022",
            ...options,
          },
          files: [file],
        },
        null,
        2,
      )}\n`,
    );
    run("npx", ["tsc", "-p", name]);
  };

  for (const [module, moduleResolution] of [
    ["ESNext", "Bundler"],
    ["NodeNext", "NodeNext"],
  ]) {
    compile("tsconfig.neutral.json", "neutral.ts", {
      module,
      moduleResolution,
      lib: ["ES2022"],
      types: [],
    });
    compile("tsconfig.platforms.json", "platforms.tsx", {
      module,
      moduleResolution,
      lib: ["ES2022", "DOM"],
      jsx: "react-jsx",
      skipLibCheck: true,
    });
  }

  write(
    "smoke.mjs",
    [
      'import assert from "node:assert/strict";',
      `const expected = ${JSON.stringify(RUNTIME_EXPORTS)};`,
      "",
      "for (const [subpath, names] of Object.entries(expected)) {",
      '  const namespace = await import(subpath === "." ? "@priemskiyyy/pulse" : `@priemskiyyy/pulse${subpath.slice(1)}`);',
      "",
      "  assert.deepEqual(Object.keys(namespace).sort(), [...names].sort(), subpath);",
      "}",
      "",
      'const { Pulse } = await import("@priemskiyyy/pulse");',
      'const { browser } = await import("@priemskiyyy/pulse/browser");',
      'const { createMockAdapter } = await import("@priemskiyyy/pulse/testing");',
      'const mock = createMockAdapter({ initial: { phase: "foreground", interaction: "available" } });',
      "const pulse = new Pulse({ adapter: mock.adapter });",
      "const events = [];",
      "",
      'pulse.on("background", (event) => events.push(event.type));',
      "pulse.start();",
      'mock.emit({ phase: "background", interaction: "unavailable" });',
      'assert.deepEqual(events, ["background"]);',
      "assert.equal(browser().available(), false);",
      "",
    ].join("\n"),
  );
  run("node", ["smoke.mjs"]);

  console.log(
    `Verified ${packed.filename}: ${files.length} files, ${Object.keys(ENTRIES).length} entry points, staged with its checksum.`,
  );
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
