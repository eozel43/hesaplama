import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const constants = JSON.parse(readFileSync(new URL('../src/data/constants.json', import.meta.url), 'utf8'));

for (const width of [320, 390, 768, 1280]) {
  test(`tariffs and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((data) => {
      localStorage.setItem('isAuth', 'true');
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('appConstants', JSON.stringify({ ...data, TARIFF_VERSION: 'old', TICKET_TYPES: data.TICKET_TYPES.map((t: { price: number }) => ({ ...t, price: 1 })) }));
    }, constants);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Tarife Dengeleme', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('appConstants')!).TICKET_TYPES.map((t: {price: number}) => t.price))).toEqual([38, 25, 22, 46, 49, 31, 28, 15, 13]);
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await fits()).toBe(true);
    const values = page.getByPlaceholder('Belirlenen Değer', { exact: true });
    await expect(values.nth(0)).toHaveValue('90.67');
    await expect(values.nth(2)).toHaveValue('134.75');
    for (const [index, input] of (await values.all()).entries()) await input.fill(index % 2 ? '110' : '100');
    await page.getByRole('button', { name: 'Senaryoyu Hesapla' }).click();
    await expect(page.getByRole('heading', { name: 'Tarife yansımaları', exact: true })).toBeVisible();
    await expect(page.locator('.tariff-comparison tbody tr')).toHaveCount(9);
    await expect(page.locator('.tariff-comparison tbody tr').first().locator('td').nth(1)).toHaveText('41,80');
    await expect(page.locator('.tariff-comparison tbody tr').first().locator('td').nth(2)).toHaveText('42,00');
    await expect(page.locator('.calculation-output > div')).toHaveCSS('opacity', '1');
    expect(await fits()).toBe(true);
    await page.screenshot({ path: `tmp/calculation-${width}.png`, fullPage: true });
    await page.emulateMedia({ media: 'print' });
    for (const input of await page.getByPlaceholder('Belirlenen Değer', { exact: true }).all()) await expect(input).toBeVisible();
    await expect(page.getByRole('button', { name: 'Senaryoyu Hesapla' })).toBeHidden();
    await expect(page.locator('.decision-band')).toBeVisible();
    if (width === 1280) await page.screenshot({ path: 'tmp/corporate-print.png', fullPage: true });
    await page.emulateMedia({ media: 'screen' });
    if (width === 390) {
      await page.getByRole('button', { name: 'Renk temasını değiştir' }).click();
      await page.screenshot({ path: 'tmp/corporate-dark.png', fullPage: true });
      await page.getByRole('button', { name: 'Renk temasını değiştir' }).click();
    }
    await page.getByRole('button', { name: 'Sıfırla', exact: true }).click();
    await expect(values.nth(0)).toHaveValue('90.67');
    await expect(values.nth(2)).toHaveValue('134.75');
    await page.getByRole('button', { name: 'Tarife Dengeleme', exact: true }).click();
    const region = page.getByRole('region', { name: 'Tarife dengeleme tablosu, yatay kaydırılabilir' });
    await expect(region).toBeVisible();
    expect(await fits()).toBe(true);
    expect(await region.evaluate(el => el.getBoundingClientRect().right <= window.innerWidth)).toBe(true);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(9);
    for (const [index, ticket] of constants.TICKET_TYPES.entries()) {
      await expect(rows.nth(index).locator('td').nth(5)).toContainText(ticket.price.toFixed(1).replace('.', ','));
    }
    await region.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    if (width < 1280) expect(await region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await page.screenshot({ path: `tmp/responsive-${width}.png`, fullPage: true });
  });
}
