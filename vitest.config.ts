import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import solid from "vite-plugin-solid";
import { configDefaults, defineConfig } from "vitest/config";

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
        resolve: {
          alias: {
            src: fileURLToPath(new URL("./packages/vue/src", import.meta.url)),
          },
          dedupe: ["vue"],
        },
        test: {
          name: "vue",
          include: ["packages/vue/src/**/*.test.ts"],
          exclude: [...configDefaults.exclude, "**/*.server.test.ts"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        plugins: [svelte({ configFile: false })],
        // The client build, where effects run.
        resolve: { conditions: ["browser"] },
        test: {
          name: "svelte",
          include: ["packages/svelte/src/**/*.test.ts"],
          exclude: [...configDefaults.exclude, "**/*.server.test.ts"],
          environment: "jsdom",
        },
      },
      // A binding's server render and its hydration each need their own build
      // of the framework, so they run as projects of their own.
      {
        extends: true,
        plugins: [solid({ ssr: true })],
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./packages/solid/src", import.meta.url),
            ),
          },
        },
        test: {
          name: "solid-ssr",
          include: ["packages/solid/src/**/*.server.test.tsx"],
          environment: "node",
        },
      },
      {
        extends: true,
        // In jsdom this compiles hydratable DOM output, which claims the markup the server test pins.
        plugins: [solid({ ssr: true })],
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./packages/solid/src", import.meta.url),
            ),
          },
          conditions: ["development", "browser"],
          dedupe: ["solid-js"],
        },
        test: {
          name: "solid-hydration",
          include: ["packages/solid/src/**/hydration.test.tsx"],
          environment: "jsdom",
          server: { deps: { inline: [/solid-js/] } },
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            src: fileURLToPath(new URL("./packages/vue/src", import.meta.url)),
          },
          dedupe: ["vue"],
        },
        test: {
          name: "vue-ssr",
          include: ["packages/vue/src/**/*.server.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        plugins: [svelte({ configFile: false })],
        test: {
          name: "svelte-ssr",
          include: ["packages/svelte/src/**/*.server.test.ts"],
          environment: "node",
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
