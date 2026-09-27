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
