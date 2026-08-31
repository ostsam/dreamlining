import { expect, test } from "@playwright/test";

test("production server smoke seam", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Dreamlining/i);
});
