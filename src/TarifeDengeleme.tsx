import { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import constants from './data/constants.json';
import { nonKart43Surcharge } from './lib/tariffRules';

// --- Veri ---
// Aylık ortalama biniş sayıları; fiyatlar ve adlar constants.json'daki güncel tarifeden alınır.
const TICKET_IDS: Record<string, string> = { ilkokul: 'ilkokul_lise', kredi: 'kredi_karti', nfc: 'nfc_qr', universite: 'uni_ogrenci', ikamet: 'uni_ikamet', ogr16: 'uni_hat16' };
const INITIAL_TARIFFS = [
  { id: "tam", name: "Tam Biniş", boardings: 710367, currentPrice: 35, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "basin", name: "Basın Kartı", boardings: 34, currentPrice: 23.3, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "ilkokul", name: "İlkokul-Lise", boardings: 287734, currentPrice: 19.8, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "kredi", name: "Kredi Kartı", boardings: 158909, currentPrice: 42, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "nfc", name: "NFC-QR", boardings: 55756, currentPrice: 44.5, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "universite", name: "Üniversite Öğrenci", boardings: 339240, currentPrice: 28, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "ikamet", name: "İkametgah Kartı", boardings: 26723, currentPrice: 25.7, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "ogr16", name: "16 Numara Öğrenci", boardings: 42663, currentPrice: 14, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "aktarma", name: "Aktarma", boardings: 33195, currentPrice: 11.7, manualExtra: 0, include: true, locked: false, isFixed: false },
].map((tariff) => {
  const ticket = constants.TICKET_TYPES.find((item) => item.id === (TICKET_IDS[tariff.id] ?? tariff.id))!;
  return { ...tariff, currentPrice: ticket.price, name: ticket.name };
});
type Tariff = typeof INITIAL_TARIFFS[number];
type DistributionMode = "optimum" | "boardingWeighted" | "equalRevenue";
type ModeLabel = "Sabit" | "Hariç" | "Manuel" | "EÜTS kuralı" | "Optimum" | "Otomatik";

const FULL_FARE_ID = "tam";
const NON_KART43_ID = "kredi";

const DISTRIBUTION_MODES: Record<DistributionMode, { label: string; hint: string }> = {
  optimum: { label: "Optimum (en düşük sapma)", hint: "Ek tutarlar, hedef gelirden sapmayı en aza indirecek şekilde adım adım ayarlanır." },
  boardingWeighted: { label: "Biniş ağırlıklı (eşit TL artış)", hint: "Gelir farkı, serbest tarifelere biniş başına eşit TL olarak dağıtılır." },
  equalRevenue: { label: "Eşit gelir payı", hint: "Gelir farkı serbest tarifeler arasında eşit tutarlarda paylaştırılır." },
};

const BADGE_CLASS: Record<ModeLabel, string> = {
  "Sabit": "badge--fixed",
  "Hariç": "",
  "Manuel": "badge--manual",
  "EÜTS kuralı": "badge--rule",
  "Optimum": "badge--auto",
  "Otomatik": "badge--auto",
};

const money = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (v: number) => money.format(v || 0);
const fmtCurrency = (v: number) => `${fmtMoney(v)} TL`;
const fmtSigned = (v: number) => `${v > 0 ? "+" : ""}${fmtMoney(v)}`;
const fmtInteger = (v: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v || 0);
const formatRateStr = (rate: number) => rate.toFixed(2);

function computeBalance(tariffs: Tariff[], rate: number, distributionMode: DistributionMode, stepSize: number, linkNonKart43: boolean) {
  const mult = Math.round(1 / stepSize);
  const eps = 0.0001;
  const snap = (v: number) => Math.round(v * mult) / mult;

  const exactPrices: Record<string, number> = {};
  const basePrices: Record<string, number> = {};
  let idealMacroRevenue = 0;

  tariffs.forEach((t) => {
    // Çift kademeli yuvarlama: önce kuruşa, sonra 10 kuruşa.
    const kurusBase = Math.round((t.currentPrice * (1 + rate / 100) + eps) * 100) / 100;
    const exact = Math.round((kurusBase + eps) * 10) / 10;
    exactPrices[t.id] = exact;
    idealMacroRevenue += exact * t.boardings;
    basePrices[t.id] = Math.round((exact + eps) * mult) / mult;
  });

  const fullFare = tariffs.find((t) => t.id === FULL_FARE_ID);
  const isDerived = (t: Tariff) => linkNonKart43 && !!fullFare && t.id === NON_KART43_ID && !t.isFixed && !t.locked;
  const isAuto = (t: Tariff) => !t.isFixed && t.include && !t.locked && !isDerived(t);
  const auto = tariffs.filter(isAuto);

  const priceOf = (t: Tariff, extras: Record<string, number>): number => {
    if (t.isFixed) return t.currentPrice;
    if (isDerived(t)) {
      const full = priceOf(fullFare!, extras);
      return full + nonKart43Surcharge(full);
    }
    if (!t.include) return basePrices[t.id];
    if (t.locked) return snap(basePrices[t.id] + snap(t.manualExtra || 0));
    return snap(basePrices[t.id] + (extras[t.id] || 0));
  };
  const revenueOf = (extras: Record<string, number>) => tariffs.reduce((sum, t) => sum + priceOf(t, extras) * t.boardings, 0);
  const ikamet = tariffs.find((t) => t.id === "ikamet");
  const universite = tariffs.find((t) => t.id === "universite");
  const violates = (extras: Record<string, number>) => !!ikamet && !!universite && priceOf(ikamet, extras) > priceOf(universite, extras);

  const targetExtraRevenue = idealMacroRevenue - revenueOf({});
  const autoTotalBoardings = auto.reduce((sum, t) => sum + t.boardings, 0);
  let extras: Record<string, number> = {};

  if (distributionMode === "optimum" && auto.length > 0) {
    const baseExtra = autoTotalBoardings > 0 ? snap(targetExtraRevenue / autoTotalBoardings) : 0;
    auto.forEach((t) => { extras[t.id] = baseExtra; });

    for (let iteration = 0; iteration < 1000; iteration++) {
      let bestAbsDiff = Math.abs(idealMacroRevenue - revenueOf(extras));
      let bestMove: Record<string, number> | null = null;
      const consider = (candidate: Record<string, number>) => {
        const d = Math.abs(idealMacroRevenue - revenueOf(candidate));
        if (d < bestAbsDiff - eps && !violates(candidate)) {
          bestAbsDiff = d;
          bestMove = candidate;
        }
      };
      for (const t1 of auto) {
        consider({ ...extras, [t1.id]: snap(extras[t1.id] + stepSize) });
        consider({ ...extras, [t1.id]: snap(extras[t1.id] - stepSize) });
        for (const t2 of auto) {
          if (t1 === t2) continue;
          consider({ ...extras, [t1.id]: snap(extras[t1.id] + stepSize), [t2.id]: snap(extras[t2.id] - stepSize) });
        }
      }
      if (!bestMove) break;
      extras = bestMove;
    }
  } else {
    auto.forEach((t) => {
      const raw = distributionMode === "equalRevenue"
        ? (t.boardings > 0 ? targetExtraRevenue / auto.length / t.boardings : 0)
        : (autoTotalBoardings > 0 ? targetExtraRevenue / autoTotalBoardings : 0);
      extras[t.id] = raw >= 0 ? Math.floor((raw + eps) * mult) / mult : Math.ceil((raw - eps) * mult) / mult;
    });
  }

  const rows = tariffs.map((t) => {
    const base = basePrices[t.id];
    const finalPrice = priceOf(t, extras);
    let modeLabel: ModeLabel;
    if (t.isFixed) modeLabel = "Sabit";
    else if (isDerived(t)) modeLabel = "EÜTS kuralı";
    else if (!t.include) modeLabel = "Hariç";
    else if (t.locked) modeLabel = "Manuel";
    else modeLabel = distributionMode === "optimum" ? "Optimum" : "Otomatik";
    return {
      ...t,
      exactPrice: exactPrices[t.id],
      baseRaisedPrice: base,
      autoExtra: isAuto(t) ? extras[t.id] || 0 : 0,
      finalExtra: t.isFixed ? 0 : snap(finalPrice - base),
      finalPrice,
      modeLabel,
      derivedNote: isDerived(t) ? `Tam ücret + ${fmtMoney(nonKart43Surcharge(priceOf(fullFare!, extras)))} TL` : "",
    };
  });

  const totalFinalRevenue = revenueOf(extras);
  return {
    rows,
    idealMacroRevenue,
    totalFinalRevenue,
    diff: totalFinalRevenue - idealMacroRevenue,
    fixedCount: tariffs.filter((t) => t.isFixed).length,
    lockedCount: tariffs.filter((t) => !t.isFixed && t.include && t.locked).length,
    autoCount: auto.length,
    derivedCount: tariffs.filter(isDerived).length,
    ikametPrice: ikamet ? priceOf(ikamet, extras) : 0,
    universitePrice: universite ? priceOf(universite, extras) : 0,
    isConstraintViolated: violates(extras),
  };
}

// --- Ana Bileşen ---
export default function TarifeDengeleme({ defaultIncreaseRate = 0 }: { defaultIncreaseRate?: number }) {
  const id = useId();
  const initialRate = defaultIncreaseRate ? formatRateStr(defaultIncreaseRate) : "";
  const [baseIncreaseRate, setBaseIncreaseRate] = useState<string>(initialRate);
  const [distributionMode, setDistributionMode] = useState<DistributionMode>("optimum");
  const [stepSize, setStepSize] = useState(0.1);
  const [linkNonKart43, setLinkNonKart43] = useState(true);
  const [tariffs, setTariffs] = useState(INITIAL_TARIFFS);

  useEffect(() => {
    if (defaultIncreaseRate > 0) setBaseIncreaseRate(formatRateStr(defaultIncreaseRate));
  }, [defaultIncreaseRate]);

  const updateTariff = (tariffId: string, patch: Partial<Tariff>) => {
    setTariffs((prev) => prev.map((item) => (item.id === tariffId ? { ...item, ...patch } : item)));
  };

  const resetAll = () => {
    setBaseIncreaseRate(initialRate);
    setDistributionMode("optimum");
    setStepSize(0.1);
    setLinkNonKart43(true);
    setTariffs(INITIAL_TARIFFS);
  };

  const results = useMemo(() => {
    try {
      return { ok: true as const, ...computeBalance(tariffs, Number(baseIncreaseRate || 0), distributionMode, stepSize, linkNonKart43) };
    } catch (error) {
      console.error("Hesaplama hatası:", error);
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [tariffs, baseIncreaseRate, distributionMode, stepSize, linkNonKart43]);

  if (!results.ok) {
    return (
      <div className="panel balance-error" role="alert">
        <h2 className="text-lg font-bold">Hesaplama yapılamadı</h2>
        <p>Girilen değerlerle dengeleme hesabı tamamlanamadı. Değerleri başlangıç durumuna döndürüp yeniden deneyin.</p>
        <p className="field-hint">Teknik ayrıntı: {results.message}</p>
        <button type="button" className="btn btn--primary" onClick={resetAll}>Değerleri sıfırla</button>
      </div>
    );
  }

  const balanced = Math.abs(results.diff) < (stepSize === 0.5 ? 5 : 2);
  const fullFareName = tariffs.find((t) => t.id === FULL_FARE_ID)?.name ?? "Tam bilet";
  const ikametName = tariffs.find((t) => t.id === "ikamet")?.name ?? "Üniversite İkamet";
  const universiteName = tariffs.find((t) => t.id === "universite")?.name ?? "Üniversite Öğrenci";

  return (
    <section className="balance" aria-labelledby={`${id}-title`}>
      <div className="balance-head">
        <div>
          <h2 id={`${id}-title`}>Tarife dengeleme</h2>
          <p>Artış oranı tüm tarifelere uygulanır; yuvarlama ve sabit tutulan tarifelerden doğan gelir farkı, seçilen yönteme göre serbest tarifelere dağıtılır.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented" role="group" aria-label="Yuvarlama adımı">
            <button type="button" aria-pressed={stepSize === 0.1} onClick={() => setStepSize(0.1)}>0,10 TL adım</button>
            <button type="button" aria-pressed={stepSize === 0.5} onClick={() => setStepSize(0.5)}>0,50 TL adım</button>
          </div>
          <button type="button" className="btn btn--secondary" onClick={resetAll}>Sıfırla</button>
        </div>
      </div>

      <div className="panel balance-controls">
        <div className="field">
          <label htmlFor={`${id}-rate`}>Artış oranı (%)</label>
          <input
            id={`${id}-rate`}
            className="control"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={baseIncreaseRate}
            onChange={(e) => setBaseIncreaseRate(e.target.value)}
            onBlur={() => { if (baseIncreaseRate !== "") setBaseIncreaseRate(Number(baseIncreaseRate).toFixed(2)); }}
            aria-describedby={`${id}-rate-hint`}
          />
          <p id={`${id}-rate-hint`} className="field-hint">Hesaplama ekranındaki ağırlıklı toplam değişim varsayılan olarak aktarılır.</p>
        </div>

        <div className="field">
          <label htmlFor={`${id}-mode`}>Fark dağıtım yöntemi</label>
          <select id={`${id}-mode`} className="control" value={distributionMode} onChange={(e) => setDistributionMode(e.target.value as DistributionMode)} aria-describedby={`${id}-mode-hint`}>
            {(Object.keys(DISTRIBUTION_MODES) as DistributionMode[]).map((mode) => <option key={mode} value={mode}>{DISTRIBUTION_MODES[mode].label}</option>)}
          </select>
          <p id={`${id}-mode-hint`} className="field-hint">{DISTRIBUTION_MODES[distributionMode].hint}</p>
        </div>

        <div className="field">
          <span className="field-label">EÜTS kuralı</span>
          <label className="check">
            <input type="checkbox" checked={linkNonKart43} onChange={(e) => setLinkNonKart43(e.target.checked)} />
            <span>Kart-43 dışındaki kartlarla biniş ücretini {fullFareName.toLocaleLowerCase("tr-TR")} ücretine bağla</span>
          </label>
          <p className="field-hint">Ücret, tam ücrete ek ücret tablosundaki tutar eklenerek belirlenir (her 5 TL'lik dilim için 1 TL).</p>
        </div>
      </div>

      <div className="panel balance-summary">
        <dl>
          <dt>Hedef aylık gelir</dt>
          <dd>{fmtCurrency(results.idealMacroRevenue)}<small className="is-note">Hesaplanan ücretler yuvarlanmadan uygulansaydı</small></dd>
        </dl>
        <dl>
          <dt>Tahmini aylık gelir</dt>
          <dd>{fmtCurrency(results.totalFinalRevenue)}<small className="is-note">Yuvarlama, sabit ve manuel tarifeler sonrası</small></dd>
        </dl>
        <dl>
          <dt>Aylık gelir sapması</dt>
          <dd className={balanced ? "is-balanced" : "is-off"}>
            {fmtSigned(results.diff)} TL
            <small>
              {balanced ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              {balanced ? "Hedef gelirle dengede" : "Seçilen adımla ulaşılabilen en düşük sapma"}
            </small>
          </dd>
        </dl>
        <p className="balance-counts">
          <span>Sabit: <strong>{fmtInteger(results.fixedCount)}</strong></span>
          <span>Manuel: <strong>{fmtInteger(results.lockedCount)}</strong></span>
          <span>EÜTS kuralına bağlı: <strong>{fmtInteger(results.derivedCount)}</strong></span>
          <span>Otomatik dağıtılan: <strong>{fmtInteger(results.autoCount)}</strong></span>
        </p>
      </div>

      {results.isConstraintViolated && (
        <p className="alert alert--danger" role="alert">
          <AlertTriangle aria-hidden="true" />
          <span><strong>Kural ihlali:</strong> {ikametName} ücreti ({fmtCurrency(results.ikametPrice)}), {universiteName} ücretini ({fmtCurrency(results.universitePrice)}) aşıyor. Manuel ek tutarlarını veya sabit tarifeleri gözden geçirin.</span>
        </p>
      )}

      <p className="balance-note">
        Mevcut ücretler: {constants.DECISION_INFO.councilDecisionDate} tarih ve {constants.DECISION_INFO.councilDecisionNo} sayılı Encümen kararı. Tutarlar TL cinsindendir.
        <span className="scroll-hint"> Tüm sütunları görmek için tabloyu sağa kaydırın.</span>
      </p>

      <div className="panel balance-table-wrap" tabIndex={0} role="region" aria-label="Tarife dengeleme tablosu">
        <table className="balance-table">
          <thead>
            <tr>
              <th scope="col" className="col-check">Sabit</th>
              <th scope="col" className="col-check">Dahil</th>
              <th scope="col" className="col-check">Manuel</th>
              <th scope="col" className="col-name">Tarife</th>
              <th scope="col">Aylık ort.<br />biniş</th>
              <th scope="col">Mevcut<br />ücret</th>
              <th scope="col" className="col-exact">Hesaplanan<br />ücret</th>
              <th scope="col">Yuvarlanmış<br />baz ücret</th>
              <th scope="col">Manuel<br />ek</th>
              <th scope="col">Otomatik<br />ek</th>
              <th scope="col">Toplam<br />ek</th>
              <th scope="col" className="col-final">Nihai<br />ücret</th>
              <th scope="col" className="col-check">Durum</th>
            </tr>
          </thead>
          <tbody>
            {results.rows.map((row) => (
              <tr key={row.id} className={row.isFixed ? "is-fixed" : row.modeLabel === "Hariç" ? "is-excluded" : undefined}>
                <td className="col-check col-toggle" data-label="Sabit">
                  <input type="checkbox" checked={row.isFixed} aria-label={`${row.name}: mevcut ücreti sabit tut`} onChange={(e) => updateTariff(row.id, { isFixed: e.target.checked })} />
                </td>
                <td className="col-check col-toggle" data-label="Dahil">
                  <input type="checkbox" checked={row.include} aria-label={`${row.name}: fark dağıtımına dahil et`} disabled={row.isFixed} onChange={(e) => updateTariff(row.id, { include: e.target.checked })} />
                </td>
                <td className="col-check col-toggle" data-label="Manuel">
                  <input type="checkbox" checked={row.locked} aria-label={`${row.name}: manuel ek tutar kullan`} disabled={!row.include || row.isFixed} onChange={(e) => updateTariff(row.id, { locked: e.target.checked })} />
                </td>
                <th scope="row" className="col-name">
                  {row.name}
                  {row.derivedNote && <small>{row.derivedNote}</small>}
                </th>
                <td className="is-muted" data-label="Aylık ort. biniş">{fmtInteger(row.boardings)}</td>
                <td data-label="Mevcut ücret">{fmtMoney(row.currentPrice)}</td>
                <td className="col-exact" data-label="Hesaplanan ücret">{fmtMoney(row.exactPrice)}</td>
                <td data-label="Yuvarlanmış baz ücret" className={row.isFixed ? "is-struck" : "is-muted"}>{fmtMoney(row.baseRaisedPrice)}</td>
                <td className="col-input" data-label="Manuel ek">
                  <input
                    className="control"
                    type="number"
                    step={stepSize}
                    disabled={!row.include || row.isFixed || !row.locked}
                    value={row.manualExtra}
                    aria-label={`${row.name}: manuel ek tutar (TL)`}
                    onChange={(e) => updateTariff(row.id, { manualExtra: Number(e.target.value || 0) })}
                  />
                </td>
                <td className="is-muted" data-label="Otomatik ek">{row.isFixed ? "–" : fmtMoney(row.autoExtra)}</td>
                <td data-label="Toplam ek">{row.isFixed ? "–" : fmtSigned(row.finalExtra)}</td>
                <td className="col-final" data-label="Nihai ücret">{fmtMoney(row.finalPrice)}</td>
                <td className="col-check col-status"><span className={`badge ${BADGE_CLASS[row.modeLabel]}`}>{row.modeLabel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="balance-note">
        <strong>Sabit:</strong> mevcut ücret korunur. <strong>Dahil:</strong> tarife, gelir farkının dağıtımına katılır; işaret kaldırılırsa yuvarlanmış baz ücret uygulanır. <strong>Manuel:</strong> otomatik dağıtım yerine girilen ek tutar kullanılır.
      </p>
    </section>
  );
}
