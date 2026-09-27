import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:4191" });

test("the web build observes the document through the browser adapter", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("phase")).toHaveText("foreground");
  await expect(page.getByTestId("interaction")).toHaveText("available");
  await expect(page.getByTestId("runtime")).toContainText("web, ");
  await expect(page.getByTestId("trace")).toContainText(
    "#1 unknown / unknown -> foreground / available",
  );
});
