import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    browser: "src/browser.ts",
    "react-native": "src/react-native.ts",
    react: "src/react.ts",
    solid: "src/solid.ts",
    vue: "src/vue.ts",
    svelte: "src/svelte.ts",
    testing: "src/testing.ts",
  },
  format: ["esm"],
  target: "es2022",
  platform: "neutral",
  dts: true,
  clean: true,
  sourcemap: true,
  outputOptions: {
    // Only the hook's module is a client module; a banner on its declarations would be TS1036.
    banner: (chunk) => (chunk.fileName === "react.js" ? '"use client";' : ""),
  },
});
