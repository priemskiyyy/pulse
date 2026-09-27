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
        resolve: {
          alias: {
            src: fileURLToPath(
              new URL("./examples/recipes/src", import.meta.url),
            ),
          },
        },
        test: {
          name: "recipes",
          include: ["examples/recipes/src/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
