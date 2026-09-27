import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

// Record raw signals from the first load, and treat any data as stale.
const LAB = "/?record&staleAfter=0";

test("a real page load commits foreground from unknown", async ({ page }) => {
  await page.goto(LAB);

  await expect(page.getByTestId("phase")).toHaveText("foreground");
  await expect(page.getByTestId("interaction")).toHaveText("available");
  await expect(page.getByTestId("commits")).toHaveText(
    "#1 unknown / unknown -> foreground / available",
  );
  await expect(page.getByTestId("signals")).toContainText("pageshow");
});

test("ordinary back navigation reports whether the page was restored", async ({
  page,
}) => {
  await page.goto(LAB);

  const token = await page.getByTestId("token").textContent();

  await page.getByTestId("navigate").click();
  await page.getByTestId("back").click();
  await expect(page.getByTestId("phase")).toHaveText("foreground");

  const signals = await page.getByTestId("signals").textContent();
  const restored = signals?.includes("persisted=true") ?? false;
  const restoredToken = await page.getByTestId("token").textContent();

  test.info().annotations.push({
    type: "back/forward cache",
    description: restored ? "restored" : "not exercised, a fresh load",
  });

  // Only a persisted pageshow keeps the old document; a fresh load has a fresh token.
  if (restored) {
    expect(restoredToken).toBe(token);

    return;
  }

  expect(restoredToken).not.toBe(token);
});

test("dispose ends the observation and leaves the page's own listeners", async ({
  page,
}) => {
  await page.goto(LAB);
  await expect(page.getByTestId("phase")).toHaveText("foreground");

  await page.getByTestId("dispose").click();
  await expect(page.getByTestId("status")).toHaveText("disposed");

  // A constructed event, labeled as such: it only shows the recorder's listener survived.
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));

  await expect(page.getByTestId("signals")).toContainText("blur");
  await expect(page.getByTestId("commits").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("phase")).toHaveText("foreground");
});

test("the exported trace carries the document token and commits", async ({
  page,
}) => {
  await page.goto(LAB);
  await expect(page.getByTestId("phase")).toHaveText("foreground");

  const token = await page.getByTestId("token").textContent();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export").click(),
  ]);

  const trace: unknown = JSON.parse(
    await readFile(await download.path(), "utf8"),
  );

  expect(trace).toMatchObject({
    documentToken: token,
    commits: [{ type: "commit", sequence: 1 }],
  });
});

test("the simulation never touches the real observation", async ({ page }) => {
  await page.goto(LAB);
  await expect(page.getByTestId("phase")).toHaveText("foreground");

  await page.getByTestId("simulate-background").click();

  await expect(page.getByTestId("simulation-state")).toHaveText(
    "background / unavailable",
  );
  await expect(page.getByTestId("phase")).toHaveText("foreground");
  await expect(page.getByTestId("commits").locator("li")).toHaveCount(1);
});
