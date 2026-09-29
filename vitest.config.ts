import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    restoreMocks: true,
    projects: [
      {
        extends: true,
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./packages/pulse/src", import.meta.url),
            ),
          },
          // The hook must render against the same React instance as the renderer under test.
          dedupe: ["react", "react-dom"],
        },
        test: {
          name: "pulse",
          include: ["packages/pulse/src/**/*.test.{ts,tsx}"],
          exclude: ["packages/pulse/src/svelte/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./packages/solid/src", import.meta.url),
            ),
          },
          // Node would resolve Solid's server build, which never runs effects.
          conditions: ["development", "browser"],
          dedupe: ["solid-js"],
        },
        test: {
          name: "solid",
          include: ["packages/solid/src/**/*.test.ts"],
          environment: "jsdom",
          server: { deps: { inline: [/solid-js/] } },
        },
      },
      {
        extends: true,
        plugins: [svelte({ configFile: false })],
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./packages/pulse/src", import.meta.url),
            ),
          },
          // The client build, where onMount runs.
          conditions: ["browser"],
        },
        test: {
          name: "pulse-svelte",
          include: ["packages/pulse/src/svelte/**/*.test.ts"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./packages/react/src", import.meta.url),
            ),
          },
          // A binding must render against the same React instance as the renderer under test.
          dedupe: ["react", "react-dom"],
        },
        test: {
          name: "react",
          include: ["packages/react/src/**/*.test.{ts,tsx}"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "example-shared",
          include: ["examples/shared/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./examples/react/src", import.meta.url),
            ),
          },
          dedupe: ["react", "react-dom"],
        },
        test: {
          name: "example-react",
          include: ["examples/react/src/**/*.test.tsx"],
          environment: "jsdom",
          // Node would load the icons with their own React; through Vite they share the deduplicated one.
          server: { deps: { inline: ["@phosphor-icons/react"] } },
        },
      },
    ],
  },
});
