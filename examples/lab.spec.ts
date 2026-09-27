import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const WIDTHS = [375, 1280];

// Record raw signals from the first load, and treat any data as stale.
const LAB = "/?record&staleAfter=0";

const open = async (page: Page, width = 1280) => {
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto(LAB);
  await expect(page.getByLabel("Phase", { exact: true })).toHaveText(
    "foreground",
  );

  return errors;
};

const timeline = (page: Page) =>
  page.getByRole("list", { name: "Timeline entries" });

for (const width of WIDTHS) {
  test(`a real page load commits foreground without errors or horizontal scroll at ${width}px`, async ({
    page,
  }) => {
    const errors = await open(page, width);

    await expect(page.getByLabel("Interaction", { exact: true })).toHaveText(
      "available",
    );
    await expect(timeline(page)).toContainText(
      "#1 unknown / unknown -> foreground / available",
    );
    await expect(timeline(page)).toContainText("pageshow persisted=false");

    const scrolls = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );

    expect(scrolls).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("ordinary back navigation reports whether the page was restored", async ({
  page,
}) => {
  await open(page);

  const token = await page.getByLabel("Document token").textContent();

  await page.getByRole("link", { name: "Open the second page" }).click();
  await page.getByRole("button", { name: "Back to the lab" }).click();
  await expect(page.getByLabel("Phase", { exact: true })).toHaveText(
    "foreground",
  );

  const restored = await timeline(page)
    .getByText("persisted=true")
    .count()
    .then((count) => count > 0);

  const restoredToken = await page.getByLabel("Document token").textContent();

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
  await open(page);

  await page.getByRole("button", { name: "Dispose" }).click();
  await expect(page.getByLabel("Observation")).toHaveText("disposed");

  // A constructed event, labeled as such: it only shows the recorder's listener survived.
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));

  await expect(timeline(page)).toContainText("blur");
  await expect(page.getByLabel("Phase", { exact: true })).toHaveText(
    "foreground",
  );
});

test("the exported trace carries the document token and the commits", async ({
  page,
}) => {
  await open(page);

  const token = await page.getByLabel("Document token").textContent();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export trace" }).click(),
  ]);

  const trace: unknown = JSON.parse(
    await readFile(await download.path(), "utf8"),
  );

  expect(trace).toMatchObject({
    documentToken: token,
    entries: expect.arrayContaining([
      expect.objectContaining({
        source: "pulse",
        diagnostic: expect.objectContaining({ type: "commit", sequence: 1 }),
      }),
    ]),
  });
});

test("the simulation never touches the real observation", async ({ page }) => {
  await open(page);

  await page
    .getByRole("group", { name: "Simulated state" })
    .getByRole("button", { name: "Background" })
    .click();

  await expect(page.getByLabel("Simulated phase")).toHaveText("background");
  await expect(page.getByLabel("Phase", { exact: true })).toHaveText(
    "foreground",
  );
});
