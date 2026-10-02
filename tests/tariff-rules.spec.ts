import { test, expect } from '@playwright/test';
import { nonKart43Surcharge, roundToLira } from '../src/lib/tariffRules';

test('Kart-43 dışı ek ücret, EÜTS tablosundaki dilimlere uyar', () => {
  const cases: [number, number][] = [
    [0, 1], [5, 1], [5.01, 2], [10, 2], [15, 3], [35, 7], [35.01, 8], [38, 8], [40, 8],
    [40.01, 9], [42, 9], [45, 9], [45.01, 10], [95.01, 20], [100, 20],
  ];
  for (const [fare, surcharge] of cases) expect(nonKart43Surcharge(fare), `${fare} TL`).toBe(surcharge);
  expect(38 + nonKart43Surcharge(38)).toBe(46);
});

test('Tam TL yuvarlama, 0,5 ve üzeri küsuratı yukarı yuvarlar', () => {
  expect(roundToLira(41.8)).toBe(42);
  expect(roundToLira(27.5)).toBe(28);
  expect(roundToLira(27.49)).toBe(27);
  expect(roundToLira(25 * 1.1)).toBe(28);
});
