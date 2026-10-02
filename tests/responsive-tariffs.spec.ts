import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const constants = JSON.parse(readFileSync(new URL('../src/data/constants.json', import.meta.url), 'utf8'));

const signIn = (page: Page, data: unknown = constants) => page.addInitScript((d) => {
  localStorage.setItem('isAuth', 'true');
  localStorage.setItem('isAdmin', 'true');
  localStorage.setItem('appConstants', JSON.stringify(d));
}, data);

for (const width of [320, 390, 768, 1280]) {
  test(`tariffs and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page, { ...constants, TARIFF_VERSION: 'old', TICKET_TYPES: constants.TICKET_TYPES.map((t: { price: number }) => ({ ...t, price: 1 })) });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Tarife dengeleme', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('appConstants')!).TICKET_TYPES.map((t: {price: number}) => t.price))).toEqual([38, 25, 22, 46, 49, 31, 28, 15, 13]);
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await fits()).toBe(true);
    const values = page.locator('.period input');
    await expect(values).toHaveCount(6);
    await expect(values.nth(0)).toHaveValue('90,67');
    await expect(values.nth(2)).toHaveValue('134,75');
    for (const [index, input] of (await values.all()).entries()) await input.fill(index % 2 ? '110' : '100');
    await page.getByRole('button', { name: 'Senaryoyu hesapla' }).click();
    await expect(values.nth(0)).toHaveValue('100,00');
    await expect(page.getByRole('heading', { name: 'Tarife yansımaları', exact: true })).toBeVisible();
    const tariffRows = page.locator('.tariff-comparison tbody tr');
    await expect(tariffRows).toHaveCount(9);
    await expect(tariffRows.first().locator('td').nth(1)).toHaveText('41,80');
    await expect(tariffRows.first().locator('td').nth(2)).toHaveText('42,00');
    const nonKart43 = tariffRows.nth(3);
    await expect(nonKart43.locator('td').nth(1)).toHaveText('50,80');
    await expect(nonKart43.locator('td').nth(2)).toHaveText('51,00');
    await expect(nonKart43.locator('th')).toHaveText('Kart-43 Dışındaki Kartlarla Biniş');
    // Uygulanacak ücret her genişlikte ekranın içinde görünür (mobilde kart düzeni).
    if (width < 640) expect(await tariffRows.first().locator('.applied-price').evaluate(el => el.getBoundingClientRect().right <= window.innerWidth)).toBe(true);
    await expect(page.locator('.calculation-output > div')).toHaveCSS('opacity', '1');
    expect(await fits()).toBe(true);
    await page.screenshot({ path: `tmp/calculation-${width}.png`, fullPage: true });
    await page.emulateMedia({ media: 'print' });
    for (const value of await values.all()) await expect(value).toBeVisible();
    await expect(page.locator('.signature-block')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Senaryoyu hesapla' })).toBeHidden();
    await expect(page.locator('.decision-band')).toBeVisible();
    if (width === 1280) await page.screenshot({ path: 'tmp/corporate-print.png', fullPage: true });
    await page.emulateMedia({ media: 'screen' });
    if (width === 390) {
      await page.getByRole('button', { name: 'Renk temasını değiştir' }).click();
      await page.screenshot({ path: 'tmp/corporate-dark.png', fullPage: true });
      await page.getByRole('button', { name: 'Renk temasını değiştir' }).click();
    }
    await page.getByRole('button', { name: 'Sıfırla', exact: true }).click();
    await expect(values.nth(0)).toHaveValue('90,67');
    await expect(values.nth(2)).toHaveValue('134,75');
    await page.getByRole('button', { name: 'Tarife dengeleme', exact: true }).click();
    const region = page.getByRole('region', { name: 'Tarife dengeleme tablosu' });
    await expect(region).toBeVisible();
    expect(await fits()).toBe(true);
    expect(await region.evaluate(el => el.getBoundingClientRect().right <= window.innerWidth)).toBe(true);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(9);
    for (const [index, ticket] of constants.TICKET_TYPES.entries()) {
      await expect(rows.nth(index).locator('td').nth(4)).toHaveText(ticket.price.toFixed(2).replace('.', ','));
    }
    if (width < 640) {
      // Kart düzeni: yatay kaydırma yok, nihai ücret görünür.
      expect(await region.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await rows.first().locator('.col-final').scrollIntoViewIfNeeded();
      await expect(rows.first().locator('.col-final')).toBeInViewport({ ratio: 1 });
    } else if (width < 1280) {
      await region.evaluate(el => { el.scrollLeft = el.scrollWidth; });
      expect(await region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: `tmp/responsive-${width}.png`, fullPage: true });
  });
}

test('eksik kalem varken toplam ve tarife yansıması üretilmez', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  const values = page.locator('.period input');
  await values.nth(1).fill('100');
  await values.nth(3).fill('140');
  await page.getByRole('button', { name: 'Senaryoyu hesapla' }).click();
  await expect(page.getByRole('alert')).toContainText('Ağırlıklı toplam hesaplanmadı. Asgari ücret için başlangıç ve bitiş değerleri eksik.');
  await expect(page.locator('.total-summary')).toHaveCount(0);
  await expect(page.locator('.tariff-comparison')).toHaveCount(0);
  await values.nth(4).fill('22104');
  await values.nth(5).fill('28.075');
  await page.getByRole('button', { name: 'Senaryoyu hesapla' }).click();
  await expect(values.nth(5)).toHaveValue('28.075,00');
  await expect(page.locator('.total-summary')).toBeVisible();
});

test('silinen kayıt geri alınabilir', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Yönetim paneli' }).click();
  await page.getByRole('button', { name: '2026-08 kaydını sil' }).click();
  await expect(page.getByText('2026-08 kaydı silindi.')).toBeVisible();
  await expect(page.getByRole('button', { name: '2026-08 kaydını sil' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Geri al' }).click();
  await expect(page.getByRole('button', { name: '2026-08 kaydını sil' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('appConstants')!).TUIK_MOCK_DATA['2026-08'])).toBe(134.75);
});

test('çıkış yönetim verilerini silmez', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Çıkış' }).click();
  await expect(page.getByRole('button', { name: 'Sisteme giriş' })).toBeVisible();
  expect(await page.evaluate(() => [localStorage.getItem('isAuth'), localStorage.getItem('appConstants') !== null])).toEqual([null, true]);
});
