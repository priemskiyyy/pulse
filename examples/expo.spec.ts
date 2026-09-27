import { expect, test } from "@playwright/test";

test("the Expo web build observes the document through the browser adapter", async ({
  page,
}) => {
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4491/");

  await expect(page.getByTestId("phase")).toHaveText("foreground");
  await expect(page.getByTestId("interaction")).toHaveText("available");
  await expect(page.getByTestId("runtime")).toContainText("web, ");
  await expect(page.getByTestId("timeline")).toContainText(
    "#1 unknown / unknown -> foreground / available",
  );

  await page.getByRole("button", { name: "Background" }).click();
  await expect(page.getByTestId("simulated-state")).toHaveText(
    "background / unavailable",
  );
  await expect(page.getByTestId("phase")).toHaveText("foreground");
  expect(errors).toEqual([]);
});
