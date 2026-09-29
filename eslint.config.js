import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const toRestrictions = (entries) =>
  entries.map(([selector, message]) => ({ selector, message }));

const relativeImports = toRestrictions([
  [
    "ImportDeclaration[source.value=/^[.]/]",
    "Use src/... imports or public package imports.",
  ],
  [
    "ExportNamedDeclaration[source.value=/^[.]/]",
    "Use src/... imports for public exports.",
  ],
  [
    "ImportExpression[source.value=/^[.]/]",
    "Use src/... imports for dynamic imports.",
  ],
  [
    "TSImportType[source.value=/^[.]/]",
    "Use src/... imports for imported types.",
  ],
]);

const bannedSyntax = toRestrictions([
  [
    "TSAsExpression",
    "Do not use type assertions, including as const. Narrow the value, annotate the type, or use satisfies.",
  ],
  [
    "TSTypeAssertion",
    "Do not use type assertions. Narrow the value, annotate the type, or use satisfies.",
  ],
  ["TSNonNullExpression", "Narrow nullable values before using them."],
  ["TSEnumDeclaration", "Use a string union instead of an enum."],
  ["SwitchStatement", "Use explicit conditional dispatch."],
  [
    "UnaryExpression[operator='void']",
    "Handle promise completion and failures explicitly.",
  ],
  ["AssignmentExpression[operator='??=']", "Use explicit assignment."],
  ["AssignmentExpression[operator='||=']", "Use explicit assignment."],
  ["AssignmentExpression[operator='&&=']", "Use explicit assignment."],
  ["TSPropertySignature[readonly=true]", "Use mutable public property types."],
  ["TSIndexSignature[readonly=true]", "Use mutable index signatures."],
  ["PropertyDefinition[readonly=true]", "Use mutable property types."],
  ["TSParameterProperty[readonly=true]", "Use mutable property types."],
  [
    "TSMappedType[readonly]",
    "Do not add readonly mapped modifiers. Use the mutable type; published data is frozen at runtime.",
  ],
  ["TSTypeOperator[operator='readonly']", "Use mutable array types."],
  [
    "TSTypeReference[typeName.name=/^(Readonly|ReadonlyArray|ReadonlyMap|ReadonlySet|DeepReadonly)$/]",
    "Do not use readonly utility types. Use the mutable type; published data is frozen at runtime.",
  ],
  ["ExportAllDeclaration", "List public exports explicitly."],
  [
    "MemberExpression[property.name='removeAllListeners']",
    "Remove only the subscriptions this code added; the source is borrowed.",
  ],
  [
    "BinaryExpression[operator='instanceof'][right.name=/^(Window|Document|Pulse)$/]",
    "Check the shape: instanceof fails across realms and for structural sources.",
  ],
]);

const reexports = toRestrictions([
  [
    "ExportNamedDeclaration[source]",
    "Keep explicit re-exports at public package entry points only.",
  ],
]);

const entryPoints = [
  "packages/*/src/index.ts",
  "packages/pulse/src/index.ts",
  "packages/pulse/src/browser.ts",
  "packages/pulse/src/react-native.ts",
  "packages/pulse/src/vue.ts",
  "packages/pulse/src/svelte.ts",
  "packages/pulse/src/testing.ts",
];

const tests = [
  "**/*.test.{ts,tsx}",
  "**/*.contracts.{ts,tsx}",
  "**/*.fixture.{ts,tsx}",
];

// Each entry point reaches only its own platform: the core and the testing
// helpers are platform neutral, and no adapter or binding imports another.
// Package names are exact paths; a bare pattern would also match a folder.
const platformImports = (forbidden) => ({
  "no-restricted-imports": [
    "error",
    {
      paths: forbidden.flatMap(({ names, message }) =>
        names.map((name) => ({ name, message })),
      ),
      patterns: forbidden.map(({ groups, message }) => ({
        group: groups,
        message,
      })),
    },
  ],
});

const react = {
  names: ["react", "react-dom"],
  groups: ["react-dom/*"],
  message: "Only the React binding imports React.",
};

const reactNative = {
  names: ["react-native"],
  groups: ["react-native/*"],
  message:
    "No entry point imports React Native at runtime; the application passes AppState in.",
};

const browserSource = {
  names: [],
  groups: ["src/adapters/browser", "src/adapters/browser/**"],
  message: "Only the browser entry point imports the browser adapter.",
};

const reactNativeSource = {
  names: [],
  groups: ["src/adapters/react-native", "src/adapters/react-native/**"],
  message: "Only the React Native entry point imports its adapter.",
};

const solid = {
  names: ["solid-js"],
  groups: ["solid-js/*"],
  message: "Only the Solid binding imports Solid.",
};

const vue = {
  names: ["vue"],
  groups: ["vue/*", "@vue/*"],
  message: "Only the Vue binding imports Vue.",
};

const vueSource = {
  names: [],
  groups: ["src/vue", "src/vue/**"],
  message: "Only the Vue entry point imports the binding.",
};

const svelte = {
  names: ["svelte"],
  groups: ["svelte/*"],
  message: "Only the Svelte binding imports Svelte.",
};

const svelteSource = {
  names: [],
  groups: ["src/svelte", "src/svelte/**"],
  message: "Only the Svelte entry point imports the binding.",
};

const testRunners = {
  names: ["vitest"],
  groups: ["vitest/*", "@testing-library/*"],
  message: "Runtime code never imports a test runner.",
};

// A lifecycle observation schedules nothing: no heartbeat, polling or debounce.
const timers = [
  "setTimeout",
  "setInterval",
  "queueMicrotask",
  "requestAnimationFrame",
  "requestIdleCallback",
].map((name) => ({
  name,
  message: "Pulse schedules no work; deliver synchronously.",
}));

const hostGlobals = [
  "window",
  "document",
  "navigator",
  "self",
  "globalThis",
].map((name) => ({
  name,
  message:
    "The core is platform neutral; a host is reached only through an adapter.",
}));

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", ".artifacts/**", "tasks/**"],
  },
  {
    // No inline comment can switch a rule off; an exception is a file-scoped block here.
    linterOptions: { noInlineConfig: true },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    rules: {
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: ["const", "let"] },
        { blankLine: "always", prev: ["const", "let"], next: "*" },
        {
          blankLine: "any",
          prev: ["singleline-const", "singleline-let"],
          next: ["singleline-const", "singleline-let"],
        },
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: "*", next: "return" },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      curly: ["error", "all"],
      "no-else-return": ["error", { allowElseIf: false }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": ["error", ...relativeImports, ...bannedSyntax],
    },
  },
  {
    files: ["packages/**/src/**/*.{ts,tsx}"],
    ignores: entryPoints,
    rules: {
      "no-restricted-syntax": [
        "error",
        ...relativeImports,
        ...bannedSyntax,
        ...reexports,
      ],
    },
  },
  {
    files: ["packages/pulse/src/**/*.{ts,tsx}"],
    ignores: [
      ...tests,
      "packages/pulse/src/{browser,react-native,vue,svelte}.ts",
      "packages/pulse/src/adapters/**",
      "packages/pulse/src/vue/**",
      "packages/pulse/src/svelte/**",
    ],
    rules: {
      ...platformImports([
        react,
        reactNative,
        solid,
        vue,
        svelte,
        browserSource,
        reactNativeSource,
        vueSource,
        svelteSource,
        testRunners,
      ]),
      "no-restricted-globals": ["error", ...timers, ...hostGlobals],
    },
  },
  {
    files: [
      "packages/pulse/src/browser.ts",
      "packages/pulse/src/adapters/browser/**/*.ts",
    ],
    ignores: tests,
    rules: {
      ...platformImports([
        react,
        reactNative,
        solid,
        vue,
        svelte,
        reactNativeSource,
        vueSource,
        svelteSource,
        testRunners,
      ]),
      "no-restricted-globals": ["error", ...timers],
    },
  },
  {
    files: [
      "packages/pulse/src/react-native.ts",
      "packages/pulse/src/adapters/react-native/**/*.ts",
    ],
    ignores: tests,
    rules: {
      ...platformImports([
        react,
        reactNative,
        solid,
        vue,
        svelte,
        browserSource,
        vueSource,
        svelteSource,
        testRunners,
      ]),
      "no-restricted-globals": ["error", ...timers, ...hostGlobals],
    },
  },
  {
    // The React binding reads Pulse's public API and nothing of another platform.
    files: ["packages/react/src/**/*.{ts,tsx}"],
    ignores: tests,
    rules: {
      ...platformImports([reactNative, solid, vue, svelte, testRunners]),
      "no-restricted-globals": ["error", ...timers, ...hostGlobals],
    },
  },
  {
    // The Solid binding reads Pulse's public API and nothing of another platform.
    files: ["packages/solid/src/**/*.ts"],
    ignores: tests,
    rules: {
      ...platformImports([react, reactNative, vue, svelte, testRunners]),
      "no-restricted-globals": ["error", ...timers, ...hostGlobals],
    },
  },
  {
    files: ["packages/pulse/src/vue.ts", "packages/pulse/src/vue/**/*.ts"],
    ignores: tests,
    rules: {
      ...platformImports([
        react,
        reactNative,
        solid,
        svelte,
        browserSource,
        reactNativeSource,
        svelteSource,
        testRunners,
      ]),
      "no-restricted-globals": ["error", ...timers, ...hostGlobals],
    },
  },
  {
    files: [
      "packages/pulse/src/svelte.ts",
      "packages/pulse/src/svelte/**/*.ts",
    ],
    ignores: tests,
    rules: {
      ...platformImports([
        react,
        reactNative,
        solid,
        vue,
        browserSource,
        reactNativeSource,
        vueSource,
        testRunners,
      ]),
      "no-restricted-globals": ["error", ...timers, ...hostGlobals],
    },
  },
  {
    files: ["packages/react/**/*.{ts,tsx}", "examples/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // A global script declares the snippets' ambient names; it cannot import, so it names types with import().
    files: ["scripts/snippets.ambient.d.ts"],
    rules: { "@typescript-eslint/consistent-type-imports": "off" },
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Buffer: "readonly",
      },
    },
  },
);
