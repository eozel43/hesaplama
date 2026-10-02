// Tariff rules shared by the calculation and balancing screens.

export const FULL_FARE_TICKET_ID = 'tam';
export const NON_KART43_TICKET_ID = 'kredi_karti';

const EPS = 1e-6;

/**
 * EÜTS Teknik Şartnamesi: Kart 43 dışındaki kartlarla binişlerde tam ücrete eklenecek tutar.
 * Her 5 TL'lik dilim için 1 TL (0–5 TL → 1 TL, 5,01–10 TL → 2 TL, … 95,01–100 TL → 20 TL).
 * Şartname tablosu 100 TL'de bitiyor; üzerindeki ücretlerde aynı dilim yapısı sürdürülür.
 */
export function nonKart43Surcharge(fullFare: number): number {
  return Math.max(1, Math.ceil((fullFare - EPS) / 5));
}

export const NON_KART43_BANDS = Array.from({ length: 20 }, (_, i) => ({
  from: i === 0 ? 0 : i * 5 + 0.01,
  to: (i + 1) * 5,
  surcharge: i + 1,
}));

/** Meclis kararı: küsurat 0,5 ve üzerindeyse üst, altındaysa alt tam TL'ye yuvarlanır. */
export function roundToLira(value: number): number {
  return Math.round(value + EPS);
}
