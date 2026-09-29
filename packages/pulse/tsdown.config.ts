import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    browser: "src/browser.ts",
    "react-native": "src/react-native.ts",
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
});
