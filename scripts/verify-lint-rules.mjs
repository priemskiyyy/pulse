import assert from "node:assert/strict";
import { ESLint } from "eslint";

const eslint = new ESLint();

const CORE = "packages/pulse/src/utils/lint-probe.ts";
const TESTING = "packages/pulse/src/testing/lint-probe.ts";
const BROWSER = "packages/pulse/src/adapters/browser/lint-probe.ts";
const NATIVE = "packages/pulse/src/adapters/react-native/lint-probe.ts";
const REACT = "packages/react/src/lint-probe.ts";
const SOLID = "packages/solid/src/lint-probe.ts";
const VUE = "packages/vue/src/lint-probe.ts";
const SVELTE = "packages/svelte/src/lint-probe.ts";
const TEST = "packages/pulse/src/utils/lint-probe.test.ts";

const syntax = [
  ['import { value } from "./value";', "no-restricted-syntax"],
  ['import type { Value } from "../types";', "no-restricted-syntax"],
  ['const value = import("./value");', "no-restricted-syntax"],
  ['type Value = import("../value").Value;', "no-restricted-syntax"],
  [
    "const value = 1 as number;",
    "@typescript-eslint/consistent-type-assertions",
  ],
  ["const value = [1] as const;", "no-restricted-syntax"],
  [
    "// eslint-disable-next-line no-restricted-syntax\nconst value = [1] as const;",
    "no-restricted-syntax",
  ],
  ["/* eslint-disable */\nconst value = [1] as const;", "no-restricted-syntax"],
  ["const value = <number>1;", "no-restricted-syntax"],
  ["const value: string | null = null; value!;", "no-restricted-syntax"],
  ["enum State { Ready }", "no-restricted-syntax"],
  ["switch (1) { default: break; }", "no-restricted-syntax"],
  ["void Promise.resolve();", "no-restricted-syntax"],
  ["let value; value ??= 1;", "no-restricted-syntax"],
  ["let value = 0; value ||= 1;", "no-restricted-syntax"],
  ["let value = 0; value &&= 1;", "no-restricted-syntax"],
  ["type Value = { readonly key: string };", "no-restricted-syntax"],
  ["type Value = { readonly [key: string]: string };", "no-restricted-syntax"],
  ["class Value { readonly key = 1; }", "no-restricted-syntax"],
  [
    "class Value { constructor(readonly key: string) {} }",
    "no-restricted-syntax",
  ],
  [
    "type Value<T> = { readonly [K in keyof T]: T[K] };",
    "no-restricted-syntax",
  ],
  ["type Value = readonly string[];", "no-restricted-syntax"],
  ["type Value = Readonly<{ key: string }>;", "no-restricted-syntax"],
  ["type Value = ReadonlyArray<string>;", "no-restricted-syntax"],
  ['export * from "src/value";', "no-restricted-syntax"],
  [
    "declare const source: { removeAllListeners: () => void }; source.removeAllListeners();",
    "no-restricted-syntax",
  ],
  [
    "declare const target: unknown; const isWindow = target instanceof Window;",
    "no-restricted-syntax",
  ],
  [
    "interface Value { key: string }",
    "@typescript-eslint/consistent-type-definitions",
  ],
  ["const value: any = 1;", "@typescript-eslint/no-explicit-any"],
  [
    'import { Value } from "src/value";\n\ntype Copy = Value;',
    "@typescript-eslint/consistent-type-imports",
  ],
  ["if (true) console.log(1);", "curly"],
  [
    "function value(flag) { if (flag) { return 1; } else { return 2; } }",
    "no-else-return",
  ],
  [
    "const first = 1;\nif (first) {\n  first;\n}",
    "padding-line-between-statements",
  ],
  [
    "function value() {\n  const first = 1;\n  return first;\n}",
    "padding-line-between-statements",
  ],
];

// Each entry point reaches only its own platform.
const boundaries = [
  ['import { useState } from "react";', "no-restricted-imports", CORE],
  ['import { AppState } from "react-native";', "no-restricted-imports", CORE],
  [
    'import { browser } from "src/adapters/browser/browser";',
    "no-restricted-imports",
    CORE,
  ],
  [
    'import { sampleDocument } from "src/adapters/browser/utils/sampleDocument";',
    "no-restricted-imports",
    CORE,
  ],
  [
    'import { reactNative } from "src/adapters/react-native/reactNative";',
    "no-restricted-imports",
    TESTING,
  ],
  ['import { expect } from "vitest";', "no-restricted-imports", TESTING],
  [
    'import { render } from "@testing-library/react";',
    "no-restricted-imports",
    TESTING,
  ],
  ['import { useState } from "react";', "no-restricted-imports", BROWSER],
  [
    'import { reactNative } from "src/adapters/react-native/reactNative";',
    "no-restricted-imports",
    BROWSER,
  ],
  ['import { AppState } from "react-native";', "no-restricted-imports", NATIVE],
  [
    'import AppState from "react-native/Libraries/AppState/AppState";',
    "no-restricted-imports",
    NATIVE,
  ],
  [
    'import { browser } from "src/adapters/browser/browser";',
    "no-restricted-imports",
    NATIVE,
  ],
  ['import { AppState } from "react-native";', "no-restricted-imports", REACT],
  ['import { createSignal } from "solid-js";', "no-restricted-imports", CORE],
  ['import { createSignal } from "solid-js";', "no-restricted-imports", REACT],
  [
    'import { isServer } from "solid-js/web";',
    "no-restricted-imports",
    BROWSER,
  ],
  ['import { useState } from "react";', "no-restricted-imports", SOLID],
  ['import { ref } from "vue";', "no-restricted-imports", CORE],
  ['import { ref } from "vue";', "no-restricted-imports", SOLID],
  ['import { ref } from "@vue/reactivity";', "no-restricted-imports", REACT],
  ['import { useState } from "react";', "no-restricted-imports", VUE],
  ['import { onMount } from "svelte";', "no-restricted-imports", CORE],
  ['import { writable } from "svelte/store";', "no-restricted-imports", VUE],
  ['import { onMount } from "svelte";', "no-restricted-imports", REACT],
  ['import { ref } from "vue";', "no-restricted-imports", SVELTE],
  ['import { useState } from "react";', "no-restricted-imports", SVELTE],
  ['import { createSignal } from "solid-js";', "no-restricted-imports", VUE],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", CORE],
  ["queueMicrotask(() => {});", "no-restricted-globals", TESTING],
  ["setInterval(() => {}, 1_000);", "no-restricted-globals", BROWSER],
  ["requestAnimationFrame(() => {});", "no-restricted-globals", NATIVE],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", REACT],
  ["const view = window;", "no-restricted-globals", CORE],
  ["const page = document;", "no-restricted-globals", NATIVE],
  ["const root = globalThis;", "no-restricted-globals", REACT],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", SOLID],
  ["const page = document;", "no-restricted-globals", VUE],
  ["setTimeout(() => {}, 0);", "no-restricted-globals", SVELTE],
  [
    'export { value } from "src/value";',
    "no-restricted-syntax",
    "packages/pulse/src/utils/index.ts",
  ],
  [
    'import { useState } from "react";\n\nexport const useValue = (flag: boolean) => {\n  if (flag) {\n    useState(1);\n  }\n};',
    "react-hooks/rules-of-hooks",
    "packages/react/src/useValue.ts",
  ],
  [
    "function value() {\n  console.log(1);\n  return 1;\n}",
    "padding-line-between-statements",
    "scripts/lint-probe.mjs",
  ],
];

const entryPoints = [
  "packages/pulse/src/index.ts",
  "packages/pulse/src/browser.ts",
  "packages/pulse/src/react-native.ts",
  "packages/react/src/index.ts",
  "packages/solid/src/index.ts",
  "packages/vue/src/index.ts",
  "packages/svelte/src/index.ts",
  "packages/pulse/src/testing.ts",
];

const allowed = [
  ['import { value } from "src/value";\n\nexport const copy = value;', CORE],
  ...entryPoints.map((file) => ['export { value } from "src/value";', file]),
  ["export const value = { key: 1 } satisfies Record<string, number>;", CORE],
  ['import { expect } from "vitest";\n\nexpect(1).toBe(1);', TEST],
  [
    'import { AppState } from "react-native";\n\nexport const appState = AppState;',
    "packages/pulse/src/adapters/react-native/reactNative.contracts.ts",
  ],
  [
    'import { vi } from "vitest";\n\nexport const spy = vi.fn();',
    "packages/pulse/src/adapters/browser/browser.fixture.ts",
  ],
  ["export const view = globalThis.window;", BROWSER],
  [
    'declare const pulse: import("@priemskiyyy/pulse").Pulse;',
    "scripts/snippets.ambient.d.ts",
  ],
  [
    'export { reactNative } from "src/adapters/react-native/reactNative";',
    "packages/pulse/src/react-native.ts",
  ],
  [
    'import type { ReactNativeOptions } from "src/adapters/react-native/types/ReactNativeOptions";\n\nexport type Options = ReactNativeOptions;',
    "packages/pulse/src/adapters/react-native/reactNative.ts",
  ],
  [
    'export { useLifecycle } from "src/hooks/useLifecycle";',
    "packages/react/src/index.ts",
  ],
  [
    'import { UNKNOWN_LIFECYCLE_STATE } from "@priemskiyyy/pulse";\n\nexport const state = UNKNOWN_LIFECYCLE_STATE;',
    REACT,
  ],
  [
    'import { useSyncExternalStore } from "react";\n\nexport const useValue = useSyncExternalStore;',
    REACT,
  ],
  [
    'import { Pulse } from "src/utils/Pulse";\n\nexport const create = Pulse;',
    BROWSER,
  ],
  [
    'import { createSignal } from "solid-js";\n\nexport const signal = createSignal;',
    SOLID,
  ],
  ['import { ref } from "vue";\n\nexport const value = ref;', VUE],
  [
    'import { writable } from "svelte/store";\n\nexport const store = writable;',
    SVELTE,
  ],
  [
    'import { PULSE_CONTEXT } from "../context/PulseContext.js";\n\nexport const key = PULSE_CONTEXT;',
    SVELTE,
  ],
];

const getRuleIds = async (code, filePath) => {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages.map(
    (message) => message.ruleId ?? `parse error: ${message.message}`,
  );
};

const probes = [...syntax, ...boundaries];

for (const [code, rule, filePath = CORE] of probes) {
  const ruleIds = await getRuleIds(code, filePath);

  assert(
    ruleIds.includes(rule),
    `Missing lint rejection: ${rule} in ${filePath}: ${code}`,
  );
}

for (const [code, filePath] of allowed) {
  const ruleIds = await getRuleIds(code, filePath);

  assert.deepEqual(
    ruleIds,
    [],
    `Unexpected lint report ${ruleIds.join(", ")} in ${filePath}: ${code}`,
  );
}

console.log(
  `Verified ${syntax.length} syntax restrictions, ${boundaries.length} boundary rules and ${allowed.length} allowed forms.`,
);
