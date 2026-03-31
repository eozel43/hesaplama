import React, { useMemo, useState, useEffect } from "react";

// --- Stil Tanımlamaları ---
const cardStyle = {
  background: "white",
  padding: 16,
  borderRadius: 18,
  boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
  border: "1px solid #e2e8f0",
};

const miniCardStyle = {
  background: "white",
  padding: 14,
  borderRadius: 16,
  boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
  border: "1px solid #e2e8f0",
};

const miniTitleStyle = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 8,
};

const miniValueStyle = {
  fontSize: 22,
  fontWeight: 700,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
};

const subStyle = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 8,
};

const inputStyle = {
  width: "100%",
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  background: "white",
  boxSizing: "border-box",
} as React.CSSProperties;

const thStyle = {
  padding: "12px 10px",
  textAlign: "center",
  fontSize: 13,
  borderBottom: "1px solid #cbd5e1",
  background: "#f1f5f9",
  position: "sticky",
  top: 0,
  zIndex: 1,
} as React.CSSProperties;

const tdStyle = {
  padding: "10px",
  fontSize: 13,
  borderBottom: "1px solid #e2e8f0",
};

// --- Veri ve Yardımcı Fonksiyonlar ---
// YENİ: x3 çarpanı kaldırıldı, doğrudan aylık ortalama değerlere dönüldü.
const INITIAL_TARIFFS = [
  { id: "tam", name: "Tam Biniş", boardings: 710367, currentPrice: 30, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "basin", name: "Basın Kartı", boardings: 34, currentPrice: 20, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "ilkokul", name: "İlkokul-Lise", boardings: 287734, currentPrice: 17, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "kredi", name: "Kredi Kartı", boardings: 158909, currentPrice: 30, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "nfc", name: "NFC-QR", boardings: 55756, currentPrice: 38, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "universite", name: "Üniversite Öğrenci", boardings: 339240, currentPrice: 24, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "ikamet", name: "İkametgah Kartı", boardings: 26723, currentPrice: 22, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "ogr16", name: "16 Numara Öğrenci", boardings: 42663, currentPrice: 12, manualExtra: 0, include: true, locked: false, isFixed: false },
  { id: "aktarma", name: "Aktarma", boardings: 33195, currentPrice: 10, manualExtra: 0, include: true, locked: false, isFixed: false },
];

function fmtCurrency(v: any) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v || 0));
}

function fmtPrice(v: any) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1,
  }).format(Number(v || 0));
}

function fmtExactPrice(v: any) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1,
  }).format(Number(v || 0)) + " ₺";
}

function fmtInteger(v: any) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}

// --- Ana Bileşen ---
export default function TarifeDengeleme({ defaultIncreaseRate = 0 }: { defaultIncreaseRate?: number }) {
  const formatRateStr = (rate: number) => rate.toFixed(2);
  
  const [baseIncreaseRate, setBaseIncreaseRate] = useState<string | number>(
    defaultIncreaseRate ? formatRateStr(defaultIncreaseRate) : ""
  );

  useEffect(() => {
    if (defaultIncreaseRate > 0) {
      setBaseIncreaseRate(formatRateStr(defaultIncreaseRate));
    }
  }, [defaultIncreaseRate]);
  const [distributionMode, setDistributionMode] = useState("optimum");
  const [stepSize, setStepSize] = useState(0.1); 
  const [tariffs, setTariffs] = useState(INITIAL_TARIFFS);

  const updateTariff = (id: string, patch: any) => {
    setTariffs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const resetAll = () => {
    setBaseIncreaseRate(0);
    setDistributionMode("optimum");
    setStepSize(0.1);
    setTariffs(INITIAL_TARIFFS);
  };

  const results = useMemo(() => {
    try {
      const mult = Math.round(1 / stepSize); 
      const eps = 0.0001; 

      let idealMacroRevenue = 0;
      const exactPrices: Record<string, number> = {};
      const basePrices: Record<string, number> = {};
      const staticFinalPrices: Record<string, number> = {};
      const safeManualExtras: Record<string, number> = {};

      tariffs.forEach((t) => {
        // Çift Kademeli Yuvarlama (Double-Step Rounding)
        const kurusBase = Math.round((t.currentPrice * (1 + Number(baseIncreaseRate || 0) / 100) + eps) * 100) / 100;
        const exact = Math.round((kurusBase + eps) * 10) / 10;
        exactPrices[t.id] = exact;
        
        idealMacroRevenue += exact * Number(t.boardings || 0);
        basePrices[t.id] = Math.round((exact + eps) * mult) / mult;
        
        const safeManual = Math.round((Number(t.manualExtra || 0)) * mult) / mult;
        safeManualExtras[t.id] = safeManual;

        if (t.isFixed) {
          staticFinalPrices[t.id] = t.currentPrice;
        } else if (!t.include) {
          staticFinalPrices[t.id] = basePrices[t.id];
        } else if (t.locked) {
          staticFinalPrices[t.id] = Math.round((basePrices[t.id] + safeManual) * mult) / mult;
        }
      });

      const activeTariffs = tariffs.filter((t) => !t.isFixed);
      const included = activeTariffs.filter((t) => t.include);
      const locked = included.filter((t) => t.locked);
      const auto = included.filter((t) => !t.locked);

      let preAllocatedRevenue = 0;
      tariffs.forEach((t) => {
        if (staticFinalPrices[t.id] !== undefined) {
          preAllocatedRevenue += staticFinalPrices[t.id] * Number(t.boardings || 0);
        }
      });

      let autoBaseRevenue = 0;
      auto.forEach(t => {
        autoBaseRevenue += basePrices[t.id] * Number(t.boardings || 0);
      });

      const targetExtraRevenue = idealMacroRevenue - (preAllocatedRevenue + autoBaseRevenue);

      const autoTotalBoardings = auto.reduce((sum, t) => sum + Number(t.boardings || 0), 0);
      const autoCount = auto.length;

      let optimumExtras: Record<string, number> = {};
      if (distributionMode === "optimum" && autoCount > 0) {
        let rawBase = autoTotalBoardings > 0 ? targetExtraRevenue / autoTotalBoardings : 0;
        let baseExtra = Math.round(rawBase * mult) / mult; 
        let currentCovered = 0;

        auto.forEach((t) => {
          optimumExtras[t.id] = baseExtra;
          currentCovered += baseExtra * Number(t.boardings || 0);
        });

        const checkConstraints = (testExtras: any) => {
          const getFinalPrice = (id: string) => {
            if (staticFinalPrices[id] !== undefined) return staticFinalPrices[id];
            const extra = testExtras[id] || 0;
            return Math.round((basePrices[id] + extra) * mult) / mult;
          };
          const ikametPrice = getFinalPrice("ikamet");
          const uniPrice = getFinalPrice("universite");
          return ikametPrice <= uniPrice; 
        };

        let changed = true;
        let loopCounter = 0;

        while (changed && loopCounter < 1000) {
          changed = false;
          loopCounter++;
          let bestAbsDiff = Math.abs(targetExtraRevenue - currentCovered);
          let bestMove: any = null;

          for (let i = 0; i < auto.length; i++) {
            const t1 = auto[i];
            const b1 = Number(t1.boardings || 0);

            let testAdd = { ...optimumExtras, [t1.id]: Math.round((optimumExtras[t1.id] + stepSize) * mult) / mult };
            let diffAdd = Math.abs(targetExtraRevenue - (currentCovered + stepSize * b1));
            if (diffAdd < bestAbsDiff - eps && checkConstraints(testAdd)) {
              bestAbsDiff = diffAdd;
              bestMove = { type: 'single', newExtras: testAdd, cost: stepSize * b1 };
            }

            let testSub = { ...optimumExtras, [t1.id]: Math.round((optimumExtras[t1.id] - stepSize) * mult) / mult };
            let diffSub = Math.abs(targetExtraRevenue - (currentCovered - stepSize * b1));
            if (diffSub < bestAbsDiff - eps && checkConstraints(testSub)) {
              bestAbsDiff = diffSub;
              bestMove = { type: 'single', newExtras: testSub, cost: -stepSize * b1 };
            }

            for (let j = 0; j < auto.length; j++) {
              if (i === j) continue;
              const t2 = auto[j];
              const b2 = Number(t2.boardings || 0);
              const testSubDiff = (stepSize * b1) - (stepSize * b2);
              
              const pairCost = testSubDiff; 
              let testPair = { 
                ...optimumExtras, 
                [t1.id]: Math.round((optimumExtras[t1.id] + stepSize) * mult) / mult,
                [t2.id]: Math.round((optimumExtras[t2.id] - stepSize) * mult) / mult 
              };
              let diffPair = Math.abs(targetExtraRevenue - (currentCovered + pairCost));
              
              if (diffPair < bestAbsDiff - eps && checkConstraints(testPair)) {
                bestAbsDiff = diffPair;
                bestMove = { type: 'pair', newExtras: testPair, cost: pairCost };
              }
            }
          }

          if (bestMove) {
            optimumExtras = bestMove.newExtras;
            currentCovered += bestMove.cost;
            changed = true;
          }
        }
      }

      const rows = tariffs.map((t) => {
        const boardings = Number(t.boardings || 0);
        const baseRaisedPrice = basePrices[t.id];
        const exactPrice = exactPrices[t.id]; 

        if (t.isFixed) {
          return { ...t, exactPrice, modeLabel: "Sabit", baseRaisedPrice, autoExtra: 0, finalExtra: 0, coveredRevenue: 0, finalPrice: t.currentPrice };
        }

        const safeManualExtra = safeManualExtras[t.id];

        if (!t.include) {
          return { ...t, exactPrice, modeLabel: "Hariç", baseRaisedPrice, autoExtra: 0, finalExtra: 0, coveredRevenue: 0, finalPrice: baseRaisedPrice };
        }

        if (t.locked) {
          const finalPrice = staticFinalPrices[t.id];
          return { ...t, exactPrice, modeLabel: "Manuel", baseRaisedPrice, autoExtra: 0, finalExtra: safeManualExtra, coveredRevenue: safeManualExtra * boardings, finalPrice };
        }

        let autoExtra = 0;
        if (distributionMode === "optimum") {
          autoExtra = optimumExtras[t.id] || 0;
        } else {
          let rawAutoExtra = 0;
          if (distributionMode === "boardingWeighted") {
            rawAutoExtra = autoTotalBoardings > 0 ? targetExtraRevenue / autoTotalBoardings : 0;
          }
          if (distributionMode === "equalRevenue") {
            const perTariffRevenue = autoCount > 0 ? targetExtraRevenue / autoCount : 0;
            rawAutoExtra = boardings > 0 ? perTariffRevenue / boardings : 0;
          }
          if (distributionMode === "equalExtra") {
            rawAutoExtra = autoTotalBoardings > 0 ? targetExtraRevenue / autoTotalBoardings : 0;
          }
          
          if (rawAutoExtra >= 0) {
            autoExtra = Math.floor((rawAutoExtra + eps) * mult) / mult;
          } else {
            autoExtra = Math.ceil((rawAutoExtra - eps) * mult) / mult;
          }
        }

        return {
          ...t, exactPrice, modeLabel: distributionMode === "optimum" ? "Optimum" : "Otomatik", baseRaisedPrice, autoExtra, finalExtra: autoExtra, coveredRevenue: autoExtra * boardings,
          finalPrice: Math.round((baseRaisedPrice + autoExtra) * mult) / mult,
        };
      });

      const totalFinalRevenue = rows.reduce((sum, r) => sum + (Number(r.boardings || 0) * Number(r.finalPrice || 0)), 0);
      const diff = totalFinalRevenue - idealMacroRevenue; 
      
      const ikametRow = rows.find(r => r.id === "ikamet");
      const uniRow = rows.find(r => r.id === "universite");
      const ikametFinal = ikametRow ? ikametRow.finalPrice : 0;
      const uniFinal = uniRow ? uniRow.finalPrice : 0;
      const isConstraintViolated = ikametFinal > uniFinal;

      return {
        hasError: false,
        rows,
        includedCount: included.length,
        lockedCount: locked.length,
        autoCount,
        fixedCount: tariffs.filter(t => t.isFixed).length,
        targetExtraRevenue,
        totalFinalRevenue,
        idealMacroRevenue,
        diff,
        isConstraintViolated
      };

    } catch (error: any) {
      console.error("Hesaplama Hatası:", error);
      return {
        hasError: true,
        errorMessage: error.message,
        rows: tariffs.map(t => ({...t, exactPrice: 0, baseRaisedPrice: 0, autoExtra: 0, finalExtra: 0, finalPrice: 0, coveredRevenue: 0, modeLabel: "Hata"})),
        diff: 0,
        fixedCount: 0,
        lockedCount: 0,
        autoCount: 0,
        idealMacroRevenue: 0,
        totalFinalRevenue: 0,
        isConstraintViolated: false
      };
    }
  }, [tariffs, baseIncreaseRate, distributionMode, stepSize]);

  if (results.hasError) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", background: "#fef2f2", minHeight: "100vh" }}>
        <h1 style={{ color: "#b91c1c" }}>Sistem Çökmekten Kurtarıldı</h1>
        <p>Hesaplama motorunda bir hata oluştu, ancak arayüz korumaya alındı.</p>
        <code style={{ background: "#fee2e2", padding: 10, display: "block", borderRadius: 8 }}>Detay: {results.errorMessage}</code>
        <button onClick={resetAll} style={{ marginTop: 20, padding: "10px 20px", background: "white", border: "1px solid #b91c1c", cursor: "pointer", borderRadius: 8 }}>Sistemi Sıfırla ve Yeniden Başlat</button>
      </div>
    );
  }

  const balanced = Math.abs(results.diff) < (stepSize === 0.5 ? 5 : 2);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        padding: 24,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1650, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px" }} className="dark:text-white">Tarife Dengeleme Arayüzü</h1>
            <div style={{ marginTop: 6, color: "#475569", fontSize: 14 }} className="dark:text-slate-400">
              Makro Gelir Hedeflemesi aktif. Sistem, tüm kayıpları onararak <strong>Matematiksel Gerçek Ciroya</strong> ulaşmayı hedefler.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 12, border: "1px solid #cbd5e1" }} className="dark:bg-white/10 dark:border-white/20">
              <button
                onClick={() => setStepSize(0.1)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700,
                  background: stepSize === 0.1 ? "white" : "transparent",
                  color: stepSize === 0.1 ? "#1d4ed8" : "#64748b",
                  boxShadow: stepSize === 0.1 ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                10 Krş Adım
              </button>
              <button
                onClick={() => setStepSize(0.5)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700,
                  background: stepSize === 0.5 ? "white" : "transparent",
                  color: stepSize === 0.5 ? "#1d4ed8" : "#64748b",
                  boxShadow: stepSize === 0.5 ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                50 Krş Adım (0,5 ₺)
              </button>
            </div>

            <button
              onClick={resetAll}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: "white",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                color: "#0f172a"
              }}
            >
              Sıfırla
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle} className="dark:bg-[#1a2235] dark:border-white/10 dark:text-white glass-panel">
            <div style={labelStyle} className="dark:text-slate-300">Zam Oranı</div>
            <input
              type="number"
              step="0.01"
              value={baseIncreaseRate}
              onChange={(e) => setBaseIncreaseRate(e.target.value)}
              onBlur={() => {
                if (baseIncreaseRate !== "") {
                  setBaseIncreaseRate(Number(baseIncreaseRate).toFixed(2));
                }
              }}
              style={{...inputStyle, fontSize: 20, fontWeight: 700, color: "#0f172a"}}
            />
            <div style={subStyle} className="dark:text-slate-400">Tüm tarifelere varsayılan olarak eklenecek matematiksel taban artış.</div>
          </div>

          <div style={cardStyle} className="dark:bg-[#1a2235] dark:border-white/10 dark:text-white glass-panel">
            <div style={labelStyle} className="dark:text-slate-300">Sübvansiyon Dağıtım Yöntemi</div>
            <select
              value={distributionMode}
              onChange={(e) => setDistributionMode(e.target.value)}
              style={{...inputStyle, fontSize: 15, fontWeight: 600, color: "#0f172a"}}
            >
              <option value="optimum">Optimum Dağıtım (Makro Maksimizasyon)</option>
              <option value="boardingWeighted">Biniş Ağırlıklı (Eşit TL Artışı)</option>
              <option value="equalRevenue">Eşit Gelir Payı Yükleme</option>
              <option value="equalExtra">Eşit TL Artış</option>
            </select>
            <div style={subStyle} className="dark:text-slate-400">Açıkların serbest tarifelere matematiksel yedirilme biçimi.</div>
          </div>
          
          <div style={{ ...cardStyle, borderLeft: "4px solid #3b82f6", background: "#eff6ff" }} className="dark:bg-indigo-900/20 dark:border-indigo-500 glass-panel">
            <div style={{...labelStyle, color: "#1d4ed8"}} className="dark:text-indigo-400">Kusursuz Aylık Makro Hedef</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#1d4ed8', letterSpacing: "-0.5px" }} className="dark:text-indigo-300">
              {fmtCurrency(results.idealMacroRevenue)}
            </div>
            <div style={{...subStyle, color: "#1d4ed8"}} className="dark:text-indigo-400/80">
              Fiyatlar kuruşu kuruşuna uygulansaydı aylık bazda kasaya girecek toplam gelir.
            </div>
          </div>

          <div style={{ ...cardStyle, borderLeft: "4px solid #166534", background: "#f0fdf4" }} className="dark:bg-green-900/20 dark:border-green-500 glass-panel">
            <div style={{...labelStyle, color: "#166534"}} className="dark:text-green-400">Nihai Gerçekleşen Aylık Ciro</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#166534', letterSpacing: "-0.5px" }} className="dark:text-green-300">
              {fmtCurrency(results.totalFinalRevenue)}
            </div>
            <div style={{...subStyle, color: "#166534"}} className="dark:text-green-400/80">
              Yuvarlamalar, sabitler ve optimizasyon sonrası aylık bazda fiilen girecek para.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={miniCardStyle} className="dark:bg-[#1a2235] dark:border-white/10 glass-panel dark:text-white">
            <div style={miniTitleStyle} className="dark:text-slate-400">Dondurulmuş (Sabit) Tarife</div>
            <div style={{...miniValueStyle, color: "#991b1b"}} className="dark:text-red-400">{fmtInteger(results.fixedCount)}</div>
          </div>
          <div style={miniCardStyle} className="dark:bg-[#1a2235] dark:border-white/10 glass-panel dark:text-white">
            <div style={miniTitleStyle} className="dark:text-slate-400">Manuel Tarife Sayısı</div>
            <div style={miniValueStyle}>{fmtInteger(results.lockedCount)}</div>
          </div>
          <div style={miniCardStyle} className="dark:bg-[#1a2235] dark:border-white/10 glass-panel dark:text-white">
            <div style={miniTitleStyle} className="dark:text-slate-400">Otomatik Dağıtılan Tarife</div>
            <div style={miniValueStyle}>{fmtInteger(results.autoCount)}</div>
          </div>
          <div style={miniCardStyle} className="dark:bg-[#1a2235] dark:border-white/10 glass-panel dark:text-white">
            <div style={miniTitleStyle} className="dark:text-slate-400">Aylık Bütçe Sapması</div>
            <div style={{ ...miniValueStyle, color: balanced ? "#166534" : "#b91c1c" }} className={balanced ? "dark:text-green-400" : "dark:text-red-400"}>{results.diff > 0 ? "+" : ""}{fmtCurrency(results.diff)}</div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 18,
            boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
            overflowX: "auto",
            border: "1px solid #e2e8f0",
          }}
          className="dark:bg-[#1a2235] dark:border-white/10 glass-panel"
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr>
                <th style={thStyle} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Sabit</th>
                <th style={thStyle} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Dahil</th>
                <th style={thStyle} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Manuel</th>
                <th style={{...thStyle, textAlign: "left"}} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Tarife Grubu</th>
                <th style={{ ...thStyle, textAlign: "right" }} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Aylık Ort. Biniş</th>
                <th style={{ ...thStyle, textAlign: "right" }} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Mevcut Fiyat</th>
                <th style={{ ...thStyle, textAlign: "right", background: "#fefce8", color: "#854d0e" }} className="dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-white/10">Gerçek Zamlı<br/>(Hesaplanan)</th>
                <th style={{ ...thStyle, textAlign: "right" }} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Yuvarlanmış<br/>Baz Zam</th>
                <th style={{ ...thStyle, textAlign: "right" }} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Manuel Ek</th>
                <th style={{ ...thStyle, textAlign: "right" }} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Oto. Ek (TL)</th>
                <th style={{ ...thStyle, textAlign: "right" }} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Nihai Ek Zam</th>
                <th style={{ ...thStyle, textAlign: "right", background: "#f0fdf4", color: "#166534" }} className="dark:bg-green-900/40 dark:text-green-400 dark:border-white/10">Nihai Ücret</th>
                <th style={{ ...thStyle, textAlign: "center" }} className="dark:bg-[#202940] dark:border-white/10 dark:text-slate-300">Durum</th>
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row) => (
                <tr key={row.id} style={{ 
                  background: row.isFixed ? "#fef2f2" : row.include ? "transparent" : "#f8fafc", 
                  opacity: (!row.include && !row.isFixed) ? 0.6 : 1 
                }} className={row.isFixed ? "dark:bg-red-900/10" : row.include ? "" : "dark:bg-white/5"}>
                  <td style={{ ...tdStyle, textAlign: "center" }} className="dark:border-white/5">
                    <input
                      type="checkbox"
                      checked={row.isFixed}
                      onChange={(e) => updateTariff(row.id, { isFixed: e.target.checked })}
                      style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#dc2626" }}
                    />
                  </td>

                  <td style={{ ...tdStyle, textAlign: "center" }} className="dark:border-white/5">
                    <input
                      type="checkbox"
                      checked={row.include}
                      disabled={row.isFixed}
                      onChange={(e) => updateTariff(row.id, { include: e.target.checked })}
                      style={{ cursor: row.isFixed ? "not-allowed" : "pointer", width: 16, height: 16 }}
                    />
                  </td>

                  <td style={{ ...tdStyle, textAlign: "center" }} className="dark:border-white/5">
                    <input
                      type="checkbox"
                      checked={row.locked}
                      disabled={!row.include || row.isFixed}
                      onChange={(e) => updateTariff(row.id, { locked: e.target.checked })}
                      style={{ cursor: (!row.include || row.isFixed) ? "not-allowed" : "pointer", width: 16, height: 16 }}
                    />
                  </td>

                  <td style={tdStyle} className="dark:border-white/5">
                    <div style={{ fontWeight: 600, color: row.isFixed ? "#991b1b" : "#1e293b" }} className={row.isFixed ? "dark:text-red-400" : "dark:text-slate-200"}>{row.name}</div>
                  </td>

                  <td style={{ ...tdStyle, textAlign: "right", color: "#64748b" }} className="dark:text-slate-400 dark:border-white/5">{fmtInteger(row.boardings)}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }} className="dark:text-slate-300 dark:border-white/5">{fmtPrice(row.currentPrice)}</td>
                  
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#854d0e", background: "#fefce8" }} className="dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-white/10">
                    {fmtExactPrice(row.exactPrice)}
                  </td>
                  
                  <td style={{ ...tdStyle, textAlign: "right", color: row.isFixed ? "#cbd5e1" : "#64748b", textDecoration: row.isFixed ? "line-through" : "none" }} className="dark:text-slate-500 dark:border-white/5">
                    {fmtPrice(row.baseRaisedPrice)}
                  </td>

                  <td style={{ ...tdStyle, textAlign: "right" }} className="dark:border-white/5">
                    <input
                      type="number"
                      step={stepSize} 
                      disabled={!row.include || row.isFixed}
                      value={row.manualExtra}
                      onChange={(e) =>
                        updateTariff(row.id, {
                          manualExtra: Number(e.target.value || 0),
                        })
                      }
                      style={{
                        width: 80,
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: row.locked ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                        textAlign: "right",
                        background: row.locked ? "#eff6ff" : (row.isFixed ? "#f1f5f9" : "white"),
                        transition: "all 0.2s",
                        color: "#0f172a"
                      }}
                    />
                  </td>

                  <td style={{ ...tdStyle, textAlign: "right", color: "#64748b" }} className="dark:text-slate-400 dark:border-white/5">{row.isFixed ? "-" : fmtPrice(row.autoExtra)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: row.isFixed ? "#94a3b8" : "#0f172a" }} className={row.isFixed ? "dark:text-slate-600 dark:border-white/5" : "dark:text-slate-200 dark:border-white/5"}>
                    {row.isFixed ? "0,0 ₺" : (row.finalExtra > 0 ? '+' : '') + fmtPrice(row.finalExtra)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, color: row.isFixed ? "#dc2626" : "#166534", fontSize: 14, background: "#f0fdf4" }} className={row.isFixed ? "dark:bg-red-900/20 dark:text-red-400 dark:border-white/5" : "dark:bg-green-900/20 dark:text-green-400 dark:border-white/5"}>
                    {fmtPrice(row.finalPrice)}
                  </td>

                  <td style={{ ...tdStyle, textAlign: "center" }} className="dark:border-white/5">
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background:
                          row.modeLabel === "Sabit"
                            ? "#fee2e2"
                          : row.modeLabel === "Manuel"
                            ? "#dbeafe"
                          : row.modeLabel === "Optimum"
                            ? "#fef08a"
                          : row.modeLabel === "Otomatik"
                            ? "#dcfce7"
                          : "#e2e8f0",
                        color:
                          row.modeLabel === "Sabit"
                            ? "#991b1b"
                          : row.modeLabel === "Manuel"
                            ? "#1d4ed8"
                          : row.modeLabel === "Optimum"
                            ? "#854d0e"
                          : row.modeLabel === "Otomatik"
                            ? "#166534"
                          : "#475569",
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      {row.modeLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <div style={{ padding: "24px", background: "#1e293b", color: "white", borderRadius: 18, boxShadow: "0 10px 25px rgba(15,23,42,0.15)" }} className="dark:bg-[#0f1115]">
            <div style={{ fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>1. Adım: Gerçek Hesaplanan</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>İdeal Aylık Gelir</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#60a5fa", marginTop: 8 }}>
              {fmtCurrency(results.idealMacroRevenue)}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
              "Gerçek Zamlı" fiyatlar ile aylık binişlerin çarpımı. Kusursuz senaryo.
            </div>
          </div>

          <div style={{ padding: "24px", background: "#0f172a", color: "white", borderRadius: 18, boxShadow: "0 10px 25px rgba(15,23,42,0.2)" }} className="dark:bg-indigo-950">
            <div style={{ fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>2. Adım: Yuvarlama & Sübvansiyon</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>Nihai Aylık Ciro</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#4ade80", marginTop: 8 }}>
              {fmtCurrency(results.totalFinalRevenue)}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
              "Nihai Ücret" ile aylık binişlerin çarpımı. Gerçekleşecek Ciro.
            </div>
          </div>

          <div style={{ padding: "24px", background: balanced ? "#f0fdf4" : "#fef2f2", borderRadius: 18, border: balanced ? "2px solid #bbf7d0" : "2px solid #fecaca" }} className={balanced ? "dark:bg-green-950 dark:border-green-800" : "dark:bg-red-950 dark:border-red-800"}>
            <div style={{ fontSize: 13, color: balanced ? "#166534" : "#991b1b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }} className={balanced ? "dark:text-green-400" : "dark:text-red-400"}>3. Adım: Algoritmik Sapma</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "#334155" }} className="dark:text-slate-200">Makro Fark (Varyans)</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: balanced ? "#166534" : "#b91c1c", marginTop: 8 }} className={balanced ? "dark:text-green-500" : "dark:text-red-500"}>
              {results.diff > 0 ? "+" : ""}{fmtCurrency(results.diff)}
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 8, fontWeight: 500 }} className="dark:text-slate-300">
              {balanced 
                ? "Sistem, yuvarlamalardan ve Sabit fiyatlardan doğan tüm açığı kusursuz dengeledi." 
                : "Kaba adım boyutundan (Örn: 50 Krş) kaynaklı inilebilen en düşük matematiksel sapma."}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {results.isConstraintViolated && (
            <div style={{ padding: "16px 20px", background: "#fef2f2", color: "#b91c1c", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "2px solid #fca5a5", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <span>Kural İhlali Tespit Edildi: "Üniversite İkamet" tarifesinin sahadaki ücreti, "Üniversite Öğrenci" tarifesini aşmaktadır. Algoritma bu işlemi durdurmuştur. Lütfen "Manuel" atamalarınızı gözden geçirin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
