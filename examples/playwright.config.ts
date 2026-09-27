import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

// Real Chromium against the built lab. Visibility, freeze and the back/forward cache stay manual exercises.
export default defineConfig({
  testDir: "tests",
  outputDir: "../../.artifacts/lab-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  timeout: 30_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4190",
    trace: "retain-on-failure",
    ...(executablePath === undefined
      ? {}
      : { launchOptions: { executablePath } }),
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command:
      "pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4190 --strictPort",
    url: "http://127.0.0.1:4190",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
