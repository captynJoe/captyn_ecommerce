import { test, expect } from '@playwright/test';

test('homepage has title and links', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Captyn Global/i);

  // Expect a link with text "Shop by Category" to be visible
  const shopByCategory = page.locator('text=Shop by Category');
  await expect(shopByCategory).toBeVisible();
});
