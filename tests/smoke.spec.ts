import { test, expect } from '@playwright/test';

test('login page loads and shows login button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button:has-text("Sisteme Giriş")')).toBeVisible();
});
