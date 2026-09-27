import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

// Real Chromium against the built examples. Visibility, freeze and the back/forward cache stay manual exercises.
export default defineConfig({
  testDir: ".",
  testMatch: ["lab.spec.ts", "expo.spec.ts"],
  outputDir: "../.artifacts/example-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: process.env.CI !== undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4490",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(executablePath === undefined
      ? {}
      : { launchOptions: { executablePath } }),
  },
  projects: [{ name: "chromium" }],
  webServer: [
    {
      command:
        "pnpm --filter example-react build && pnpm --filter example-react exec vite preview --host 127.0.0.1 --port 4490 --strictPort",
      cwd: "..",
      url: "http://127.0.0.1:4490",
      reuseExistingServer: process.env.CI === undefined,
      timeout: 120_000,
    },
    {
      command:
        "pnpm --filter example-expo build && pnpm --filter example-react exec vite preview --outDir ../expo/dist --host 127.0.0.1 --port 4491 --strictPort",
      cwd: "..",
      url: "http://127.0.0.1:4491",
      reuseExistingServer: process.env.CI === undefined,
      timeout: 180_000,
    },
  ],
});
