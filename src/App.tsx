import React, { useEffect, useId, useMemo, useState } from 'react';
import { AlertTriangle, Calculator, Info, LogOut, Moon, Printer, Sun } from 'lucide-react';
import logo from './assets/logo.webp';
import constants from './data/constants.json';
import TarifeDengeleme from './TarifeDengeleme';
import { FULL_FARE_TICKET_ID, NON_KART43_BANDS, NON_KART43_TICKET_ID, nonKart43Surcharge, roundToLira } from './lib/tariffRules';

// --- TYPES ---
type CalculationCategory = 'fuel' | 'tufe' | 'wage';
interface Ticket { id: string; name: string; price: number; note?: string }
interface AppData {
    TARIFF_VERSION: string;
    TUIK_MOCK_DATA: Record<string, number>;
    ASGARI_UCRET_MOCK_DATA: Record<string, number>;
    WEIGHTS: Record<CalculationCategory, number>;
    TICKET_TYPES: Ticket[];
}
interface CalculationData { month1: string; year1: string; value1: string; month2: string; year2: string; value2: string; }
type PeriodField = keyof CalculationData;
type CalculationResult = { isValid: true; change: number; weightedChange: number } | { isValid: false; error: string };

// --- CONSTANTS ---
const INITIAL_DATA = constants as AppData & { DECISION_INFO: typeof constants.DECISION_INFO };
const { TUIK_MOCK_DATA: INITIAL_TUIK, ASGARI_UCRET_MOCK_DATA: INITIAL_WAGE, WEIGHTS: INITIAL_WEIGHTS, TICKET_TYPES: INITIAL_TICKETS } = INITIAL_DATA;
const DECISION = constants.DECISION_INFO;

const MONTH_NAMES = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const CATEGORY_LABELS: Record<CalculationCategory, string> = { fuel: 'Yakıt', tufe: 'TÜFE', wage: 'Asgari ücret' };
const TUFE_START_KEY = `${DECISION.tufeYear}-${String(DECISION.tufeMonth).padStart(2, '0')}`;
const INITIAL_DATA_STATE: CalculationData = { month1: '', year1: '', value1: '', month2: '', year2: '', value2: '' };
const INITIAL_FUEL_STATE: CalculationData = { ...INITIAL_DATA_STATE, month1: String(DECISION.fuelMonth), year1: String(DECISION.fuelYear), value1: String(DECISION.fuelPrice) };
const INITIAL_TUFE_STATE: CalculationData = { ...INITIAL_DATA_STATE, month1: String(DECISION.tufeMonth), year1: String(DECISION.tufeYear), value1: String(INITIAL_TUIK[TUFE_START_KEY] ?? '') };
const initialInputs = () => ({ fuel: { ...INITIAL_FUEL_STATE }, tufe: { ...INITIAL_TUFE_STATE }, wage: { ...INITIAL_DATA_STATE } });

const formatNumber = (value: number, decimals = 2) => value.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const formatSigned = (value: number, decimals = 2) => `${value > 0 ? '+' : ''}${formatNumber(value, decimals)}`;
const formatWeight =(weight: number) => (weight * 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const today = () => new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
};

// --- SMALL COMPONENTS ---
function Tooltip({ text, label }: { text: string; label: string }) {
    const id = useId();
    return (
        <span className="tooltip">
            <button type="button" aria-label={label} aria-describedby={id}><Info aria-hidden="true" /></button>
            <span role="tooltip" id={id}>{text}</span>
        </span>
    );
}

function SurchargeTable() {
    return (
        <div className="surcharge-table" role="table" aria-label="Kart 43 dışı kartlar ek ücret tablosu">
            {NON_KART43_BANDS.map(band => (
                <div key={band.to} role="row">
                    <span role="cell">{formatNumber(band.from)} – {formatNumber(band.to)} TL</span>
                    <strong role="cell">+{formatNumber(band.surcharge)}</strong>
                </div>
            ))}
        </div>
    );
}

// --- ADMIN PANEL ---
type AdminTab = 'tufe' | 'wage' | 'weights' | 'tickets';
const ADMIN_TABS: { id: AdminTab; label: string }[] = [
    { id: 'tufe', label: 'TÜFE' },
    { id: 'wage', label: 'Asgari ücret' },
    { id: 'weights', label: 'Ağırlıklar' },
    { id: 'tickets', label: 'Tarifeler' },
];
const SERIES_CONFIG = {
    tufe: { target: 'TUIK_MOCK_DATA', keyLabel: 'Dönem (YYYY-AA)', keyPlaceholder: 'örn. 2026-09', pattern: /^\d{4}-(0[1-9]|1[0-2])$/, valueLabel: 'Endeks değeri' },
    wage: { target: 'ASGARI_UCRET_MOCK_DATA', keyLabel: 'Yıl', keyPlaceholder: 'örn. 2027', pattern: /^\d{4}$/, valueLabel: 'Net asgari ücret (TL)' },
} as const;

function AdminPanel({ data, onUpdate }: { data: AppData, onUpdate: (newData: AppData) => void }) {
    const [newData, setNewData] = useState(data);
    const [activeTab, setActiveTab] = useState<AdminTab>('tufe');
    const [keys, setKeys] = useState({ tufe: '', wage: '' });
    const [vals, setVals] = useState({ tufe: '', wage: '' });
    const [seriesError, setSeriesError] = useState('');
    const [ticketForm, setTicketForm] = useState({ id: '', name: '', price: '', note: '' });
    const [ticketError, setTicketError] = useState('');
    const [weightDrafts, setWeightDrafts] = useState<Record<CalculationCategory, string>>(() => ({
        fuel: formatWeight(data.WEIGHTS.fuel), tufe: formatWeight(data.WEIGHTS.tufe), wage: formatWeight(data.WEIGHTS.wage),
    }));
    const [undo, setUndo] = useState<{ message: string; snapshot: AppData } | null>(null);
    const baseId = useId();

    useEffect(() => {
        if (!undo) return;
        const timer = setTimeout(() => setUndo(null), 10000);
        return () => clearTimeout(timer);
    }, [undo]);

    const commit = (updated: AppData) => { setNewData(updated); onUpdate(updated); setUndo(null); };
    const commitDeletion = (updated: AppData, message: string) => {
        const snapshot = newData;
        commit(updated);
        setUndo({ message, snapshot });
    };

    const handleUpdate = (type: 'tufe' | 'wage') => {
        const config = SERIES_CONFIG[type];
        const key = keys[type].trim();
        const value = parseFloat(vals[type].replace(',', '.'));
        if (!config.pattern.test(key)) return setSeriesError(`${config.keyLabel} biçimi hatalı. Örnek: ${config.keyPlaceholder.replace('örn. ', '')}`);
        if (!Number.isFinite(value) || value <= 0) return setSeriesError('Değer sıfırdan büyük bir sayı olmalıdır.');
        commit({ ...newData, [config.target]: { ...newData[config.target], [key]: value } });
        setKeys({ ...keys, [type]: '' });
        setVals({ ...vals, [type]: '' });
        setSeriesError('');
    };

    const handleDelete = (type: 'tufe' | 'wage', key: string) => {
        const target = SERIES_CONFIG[type].target;
        const rest = { ...newData[target] };
        delete rest[key];
        commitDeletion({ ...newData, [target]: rest }, `${key} kaydı silindi.`);
    };

    const handleWeightChange = (category: CalculationCategory, raw: string) => {
        setWeightDrafts({ ...weightDrafts, [category]: raw });
        const percent = parseFloat(raw.replace(',', '.'));
        if (Number.isFinite(percent) && percent >= 0 && percent <= 100) {
            commit({ ...newData, WEIGHTS: { ...newData.WEIGHTS, [category]: percent / 100 } });
        }
    };
    const weightTotal = (newData.WEIGHTS.fuel + newData.WEIGHTS.tufe + newData.WEIGHTS.wage) * 100;

    const handleTicketUpdate = () => {
        const price = parseFloat(ticketForm.price.replace(',', '.'));
        if (!ticketForm.name.trim()) return setTicketError('Bilet adı boş bırakılamaz.');
        if (!Number.isFinite(price) || price <= 0) return setTicketError('Fiyat sıfırdan büyük bir sayı olmalıdır.');
        const id = ticketForm.id || Math.random().toString(36).slice(2, 11);
        const newTicket = { id, name: ticketForm.name.trim(), price, note: ticketForm.note };
        const exists = newData.TICKET_TYPES.some(t => t.id === id);
        const updatedTickets = exists ? newData.TICKET_TYPES.map(t => t.id === id ? newTicket : t) : [...newData.TICKET_TYPES, newTicket];
        commit({ ...newData, TICKET_TYPES: updatedTickets });
        setTicketForm({ id: '', name: '', price: '', note: '' });
        setTicketError('');
    };

    const handleTicketDelete = (ticket: Ticket) => commitDeletion(
        { ...newData, TICKET_TYPES: newData.TICKET_TYPES.filter(t => t.id !== ticket.id) },
        `${ticket.name} tarifesi silindi.`,
    );

    const series = activeTab === 'tufe' || activeTab === 'wage' ? SERIES_CONFIG[activeTab] : null;

    return (
        <section className="panel admin" aria-labelledby={`${baseId}-title`}>
            <h2 id={`${baseId}-title`}>Yönetim paneli</h2>
            <div className="tabs" role="tablist" aria-label="Veri grupları">
                {ADMIN_TABS.map(tab => (
                    <button key={tab.id} type="button" role="tab" id={`${baseId}-tab-${tab.id}`} aria-selected={activeTab === tab.id} aria-controls={`${baseId}-panel`} tabIndex={activeTab === tab.id ? 0 : -1}
                        onClick={() => { setActiveTab(tab.id); setSeriesError(''); setTicketError(''); }}
                        onKeyDown={e => {
                            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                            const index = ADMIN_TABS.findIndex(t => t.id === activeTab);
                            const next = ADMIN_TABS[(index + (e.key === 'ArrowRight' ? 1 : ADMIN_TABS.length - 1)) % ADMIN_TABS.length];
                            setActiveTab(next.id);
                            document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="undo-region" role="status" aria-live="polite">
                {undo && (
                    <p className="undo-bar">
                        <span>{undo.message}</span>
                        <button type="button" className="btn btn--link" onClick={() => commit(undo.snapshot)}>Geri al</button>
                    </p>
                )}
            </div>

            <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${activeTab}`}>
                {series && (activeTab === 'tufe' || activeTab === 'wage') ? (
                    <>
                        <form className="admin-form" onSubmit={e => { e.preventDefault(); handleUpdate(activeTab); }}>
                            <div className="field">
                                <label htmlFor={`${baseId}-key`}>{series.keyLabel}</label>
                                <input id={`${baseId}-key`} className="control" type="text" inputMode="numeric" placeholder={series.keyPlaceholder} value={keys[activeTab]} onChange={e => setKeys({ ...keys, [activeTab]: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor={`${baseId}-value`}>{series.valueLabel}</label>
                                <input id={`${baseId}-value`} className="control" type="number" step="0.01" value={vals[activeTab]} onChange={e => setVals({ ...vals, [activeTab]: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn--primary">Kaydet</button>
                            {seriesError && <p className="alert alert--danger" role="alert" style={{ gridColumn: '1 / -1' }}><AlertTriangle aria-hidden="true" />{seriesError}</p>}
                        </form>
                        <div className="admin-list">
                            {Object.entries(newData[series.target]).sort().reverse().map(([k, v]) => (
                                <div key={k}>
                                    <span className="item-key">{k}</span>
                                    <span className="item-actions">
                                        <span className="item-value">{v.toLocaleString('tr-TR')}</span>
                                        <button type="button" className="btn btn--link" aria-label={`${k} kaydını düzenle`} onClick={() => { setKeys({ ...keys, [activeTab]: k }); setVals({ ...vals, [activeTab]: v.toString() }); }}>Düzenle</button>
                                        <button type="button" className="btn btn--link is-danger" aria-label={`${k} kaydını sil`} onClick={() => handleDelete(activeTab, k)}>Sil</button>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : activeTab === 'weights' ? (
                    <div className="weights-form">
                        {(Object.keys(CATEGORY_LABELS) as CalculationCategory[]).map(w => (
                            <div key={w} className="weight-row">
                                <label htmlFor={`${baseId}-w-${w}`} className="field-label">{CATEGORY_LABELS[w]} ağırlığı (%)</label>
                                <input id={`${baseId}-w-${w}`} className="control" type="text" inputMode="decimal" value={weightDrafts[w]} onChange={e => handleWeightChange(w, e.target.value)} />
                            </div>
                        ))}
                        <p className="field-hint">Toplam: <strong>%{weightTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</strong></p>
                        {Math.abs(weightTotal - 100) > 0.01 && (
                            <p className="alert alert--warning" role="status"><AlertTriangle aria-hidden="true" />Ağırlıkların toplamı %100 olmalıdır. Hesaplama, toplam %100 olana kadar tutarsız sonuç verir.</p>
                        )}
                    </div>
                ) : (
                    <>
                        <form className="admin-form" onSubmit={e => { e.preventDefault(); handleTicketUpdate(); }}>
                            <div className="field">
                                <label htmlFor={`${baseId}-tname`}>Bilet adı</label>
                                <input id={`${baseId}-tname`} className="control" type="text" value={ticketForm.name} onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor={`${baseId}-tprice`}>Fiyat (TL)</label>
                                <input id={`${baseId}-tprice`} className="control" type="number" step="0.01" value={ticketForm.price} onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor={`${baseId}-tnote`}>Not (isteğe bağlı)</label>
                                <input id={`${baseId}-tnote`} className="control" type="text" value={ticketForm.note} onChange={e => setTicketForm({ ...ticketForm, note: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn--primary flex-1">{ticketForm.id ? 'Güncelle' : 'Ekle'}</button>
                                {ticketForm.id && <button type="button" className="btn btn--secondary" onClick={() => { setTicketForm({ id: '', name: '', price: '', note: '' }); setTicketError(''); }}>Vazgeç</button>}
                            </div>
                            {ticketError && <p className="alert alert--danger" role="alert" style={{ gridColumn: '1 / -1' }}><AlertTriangle aria-hidden="true" />{ticketError}</p>}
                        </form>
                        <div className="admin-list">
                            {newData.TICKET_TYPES.map(t => (
                                <div key={t.id}>
                                    <span><span className="item-key">{t.name}</span>{t.note && <span className="item-note">{t.note}</span>}</span>
                                    <span className="item-actions">
                                        <span className="item-value">{formatNumber(t.price)} TL</span>
                                        <button type="button" className="btn btn--link" aria-label={`${t.name} tarifesini düzenle`} onClick={() => setTicketForm({ id: t.id, name: t.name, price: t.price.toString(), note: t.note || '' })}>Düzenle</button>
                                        <button type="button" className="btn btn--link is-danger" aria-label={`${t.name} tarifesini sil`} onClick={() => handleTicketDelete(t)}>Sil</button>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

// --- CALCULATION INPUTS ---
interface InputSectionProps {
    title: string;
    tone: CalculationCategory;
    data: CalculationData;
    onDataChange: (field: PeriodField, value: string) => void;
    years: number[];
    currency?: boolean;
    infoLink?: { url: string; text: string; label: string };
    hint?: string;
}

/** Converts Turkish-formatted input ("22.104,50", "94,5", "94.50") into a canonical decimal string ("22104.5"). */
function parseDecimalInput(raw: string): string {
    const cleaned = raw.replace(/[\s₺]/g, '');
    if (!cleaned) return '';
    const normalized = cleaned.includes(',')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : /^\d{1,3}(\.\d{3})+$/.test(cleaned) ? cleaned.replace(/\./g, '') : cleaned;
    const value = Number(normalized);
    return Number.isFinite(value) ? String(value) : '';
}

function DecimalInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
    // While editing, the raw text is kept; otherwise the value is shown in tr-TR format.
    const [draft, setDraft] = useState<string | null>(null);
    const display = draft ?? (value === '' ? '' : formatNumber(Number(value)));
    return (
        <input
            id={id}
            className="control"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={display}
            onFocus={() => setDraft(value === '' ? '' : Number(value).toLocaleString('tr-TR', { useGrouping: false, maximumFractionDigits: 6 }))}
            onChange={e => { setDraft(e.target.value); onChange(parseDecimalInput(e.target.value)); }}
            onBlur={() => setDraft(null)}
        />
    );
}

function InputSection({ title, tone, data, onDataChange, years, currency = false, infoLink, hint }: InputSectionProps) {
    const baseId = useId();
    const renderPeriod = (p: '1' | '2') => {
        const id = `${baseId}-${p}`;
        return (
            <fieldset className="period">
                <legend>{p === '1' ? 'Başlangıç dönemi' : 'Bitiş dönemi'}</legend>
                <div className="field">
                    <label htmlFor={`${id}-m`}>Ay</label>
                    <select id={`${id}-m`} className="control" value={data[`month${p}`]} onChange={e => onDataChange(`month${p}`, e.target.value)}>
                        <option value="">Seçiniz</option>
                        {MONTH_NAMES.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor={`${id}-y`}>Yıl</label>
                    <select id={`${id}-y`} className="control" value={data[`year${p}`]} onChange={e => onDataChange(`year${p}`, e.target.value)}>
                        <option value="">Seçiniz</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor={`${id}-v`}>{currency ? 'Değer (TL)' : 'Endeks değeri'}</label>
                    <div className="control-affix">
                        <DecimalInput id={`${id}-v`} value={data[`value${p}`]} onChange={v => onDataChange(`value${p}`, v)} />
                        {currency && <span className="affix" aria-hidden="true">₺</span>}
                    </div>
                </div>
            </fieldset>
        );
    };
    return (
        <fieldset className="panel input-panel" data-tone={tone}>
            <legend>
                <span>{title}</span>
                {infoLink && <a href={infoLink.url} target="_blank" rel="noopener noreferrer" aria-label={infoLink.label} className="print:hidden">{infoLink.text}</a>}
            </legend>
            {hint && <p className="field-hint panel-hint">{hint}</p>}
            <div className="period-grid">{renderPeriod('1')}{renderPeriod('2')}</div>
        </fieldset>
    );
}

function ResultCard({ title, tone, data, result, weight }: { title: string; tone: CalculationCategory; data: CalculationData; result?: CalculationResult; weight: number }) {
    if (!result) return null;
    if (!result.isValid) {
        return (
            <div className="panel result-card is-invalid" role="status">
                <h3>{title}</h3>
                <p className="flex items-start gap-2"><AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none" />{result.error}</p>
            </div>
        );
    }
    const period = (m: string, y: string) => m && y ? `${MONTH_NAMES[Number(m)]} ${y}` : '—';
    const label = CATEGORY_LABELS[tone];
    return (
        <div className="panel result-card" data-tone={tone}>
            <div>
                <h3>{title}</h3>
                <p className="result-period">{period(data.month1, data.year1)} – {period(data.month2, data.year2)}</p>
            </div>
            <div>
                <p className="result-label">
                    Ağırlıklı katkı (ağırlık %{formatWeight(weight)})
                    <Tooltip label={`${label} ağırlıklı katkısı hakkında bilgi`} text={`${label} değişiminin %${formatWeight(weight)} ağırlıkla toplam değişime katkısıdır: ${formatSigned(result.change)}% × %${formatWeight(weight)}.`} />
                </p>
                <p className="result-value">{formatSigned(result.weightedChange)}%</p>
            </div>
            <p className="result-raw"><span>{label} değişimi</span><strong>{formatSigned(result.change)}%</strong></p>
        </div>
    );
}

// --- LOGIN ---
function LoginComponent({ onLogin }: { onLogin: (u: string, p: string) => boolean }) {
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const [error, setError] = useState('');
    const id = useId();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onLogin(u, p)) setError('Kullanıcı adı veya parola hatalı. Bilgilerinizi kontrol edip yeniden deneyin.');
    };

    return (
        <main className="login">
            <div className="panel login-card">
                <header>
                    <img src={logo} alt="Kütahya Belediyesi logosu" width={84} height={84} />
                    <h1>Eşel Mobil</h1>
                    <p>Tarife Hesaplama Sistemi</p>
                    <p>Kütahya Belediyesi · Ulaşım Hizmetleri Müdürlüğü</p>
                </header>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label htmlFor={`${id}-u`}>Kullanıcı adı</label>
                        <input id={`${id}-u`} className="control" type="text" autoComplete="username" value={u} onChange={e => setU(e.target.value)} aria-invalid={!!error} />
                    </div>
                    <div className="field">
                        <label htmlFor={`${id}-p`}>Parola</label>
                        <input id={`${id}-p`} className="control" type="password" autoComplete="current-password" value={p} onChange={e => setP(e.target.value)} aria-invalid={!!error} />
                    </div>
                    {error && <p className="alert alert--danger" role="alert"><AlertTriangle aria-hidden="true" />{error}</p>}
                    <button type="submit" className="btn btn--primary">Sisteme giriş</button>
                </form>
            </div>
            <p className="login-footer">© {new Date().getFullYear()} Kütahya Belediyesi</p>
        </main>
    );
}

// --- APP ---
function App() {
    const [appData, setAppData] = useState<AppData>({ TARIFF_VERSION: constants.TARIFF_VERSION, TUIK_MOCK_DATA: INITIAL_TUIK, ASGARI_UCRET_MOCK_DATA: INITIAL_WAGE, WEIGHTS: INITIAL_WEIGHTS, TICKET_TYPES: INITIAL_TICKETS });
    const [view, setView] = useState<'calc' | 'admin' | 'dengeleme'>('calc');
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    const [auth, setAuth] = useState({ isAuth: false, isAdmin: false });
    const [inputs, setInputs] = useState<Record<CalculationCategory, CalculationData>>(initialInputs);
    const [results, setResults] = useState<Partial<Record<CalculationCategory, CalculationResult>>>({});
    const [calcError, setCalcError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('appConstants');
        if (stored) {
            const parsed = JSON.parse(stored);
            let changed = false;
            if (parsed.TARIFF_VERSION !== constants.TARIFF_VERSION) {
                const savedTickets: Ticket[] = Array.isArray(parsed.TICKET_TYPES) ? parsed.TICKET_TYPES : [];
                parsed.TICKET_TYPES = [
                    ...INITIAL_TICKETS.map(ticket => ({
                        ...savedTickets.find(saved => saved.id === ticket.id),
                        ...ticket,
                    })),
                    ...savedTickets.filter(saved => !INITIAL_TICKETS.some(ticket => ticket.id === saved.id)),
                ];
                parsed.TARIFF_VERSION = constants.TARIFF_VERSION;
                changed = true;
            }
            if (parsed.TUIK_MOCK_DATA) {
                for (const key of Object.keys(INITIAL_TUIK)) {
                    if (parsed.TUIK_MOCK_DATA[key] === undefined) {
                        parsed.TUIK_MOCK_DATA[key] = INITIAL_TUIK[key];
                        changed = true;
                    }
                }
            }
            if (parsed.ASGARI_UCRET_MOCK_DATA) {
                for (const key of Object.keys(INITIAL_WAGE)) {
                    if (parsed.ASGARI_UCRET_MOCK_DATA[key] === undefined) {
                        parsed.ASGARI_UCRET_MOCK_DATA[key] = INITIAL_WAGE[key];
                        changed = true;
                    }
                }
            }
            if (changed) {
                localStorage.setItem('appConstants', JSON.stringify(parsed));
            }
            setAppData(parsed);
        }
        if (localStorage.getItem('isAuth') === 'true') setAuth({ isAuth: true, isAdmin: localStorage.getItem('isAdmin') === 'true' });
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const handleLogin = (u: string, p: string) => {
        const isAdmin = u === import.meta.env.VITE_ADMIN_USER && p === import.meta.env.VITE_ADMIN_PASS;
        const isUser = u === import.meta.env.VITE_USER && p === import.meta.env.VITE_USER_PASS;
        if (!isAdmin && !isUser) return false;
        localStorage.setItem('isAuth', 'true'); localStorage.setItem('isAdmin', isAdmin.toString());
        setAuth({ isAuth: true, isAdmin });
        return true;
    };

    // Çıkış yalnızca oturumu kapatır; yönetim verileri ve tema tercihi korunur.
    const handleLogout = () => {
        localStorage.removeItem('isAuth');
        localStorage.removeItem('isAdmin');
        setAuth({ isAuth: false, isAdmin: false });
        setView('calc');
    };

    const handleInput = (cat: CalculationCategory, f: PeriodField, v: string) => {
        const newData = { ...inputs[cat], [f]: v };
        const lookup = (series: Record<string, number>, key: string) => series[key] !== undefined ? String(series[key]) : '';
        if (cat === 'tufe' && ['month1', 'year1', 'month2', 'year2'].includes(f)) {
            if (newData.month1 && newData.year1) newData.value1 = lookup(appData.TUIK_MOCK_DATA, `${newData.year1}-${newData.month1.padStart(2, '0')}`);
            if (newData.month2 && newData.year2) newData.value2 = lookup(appData.TUIK_MOCK_DATA, `${newData.year2}-${newData.month2.padStart(2, '0')}`);
        }
        if (cat === 'wage' && ['year1', 'year2'].includes(f)) {
            if (newData.year1) newData.value1 = lookup(appData.ASGARI_UCRET_MOCK_DATA, newData.year1);
            if (newData.year2) newData.value2 = lookup(appData.ASGARI_UCRET_MOCK_DATA, newData.year2);
        }
        setInputs({ ...inputs, [cat]: newData });
    };

    const calculate = () => {
        const isOrdered = (data: CalculationData) => {
            if (!data.year1 || !data.month1 || !data.year2 || !data.month2) return true;
            return Number(data.year2) * 12 + Number(data.month2) >= Number(data.year1) * 12 + Number(data.month1);
        };
        const unordered = (Object.keys(CATEGORY_LABELS) as CalculationCategory[]).filter(cat => !isOrdered(inputs[cat]));
        if (unordered.length) {
            setCalcError(`Bitiş dönemi, başlangıç döneminden önce olamaz. Kontrol edilecek alan: ${unordered.map(cat => CATEGORY_LABELS[cat]).join(', ')}.`);
            return;
        }

        const calc = (data: CalculationData, w: number): CalculationResult => {
            const v1 = parseFloat(data.value1), v2 = parseFloat(data.value2);
            if (!v1 || !v2) return { isValid: false, error: 'Başlangıç ve bitiş değerlerini girin.' };
            const change = ((v2 - v1) / v1) * 100;
            return { change, weightedChange: change * w, isValid: true };
        };
        setCalcError('');
        setResults({
            fuel: calc(inputs.fuel, appData.WEIGHTS.fuel),
            tufe: calc(inputs.tufe, appData.WEIGHTS.tufe),
            wage: calc(inputs.wage, appData.WEIGHTS.wage)
        });
    };

    const handleReset = () => {
        setInputs(initialInputs());
        setResults({});
        setCalcError('');
    };

    const hasResults = Object.keys(results).length > 0;
    const missingCategories = (Object.keys(CATEGORY_LABELS) as CalculationCategory[]).filter(cat => hasResults && !results[cat]?.isValid);
    const isComplete = hasResults && missingCategories.length === 0;
    // Eksik kalemle hesaplanan toplam yanıltıcı olur; tüm kalemler geçerli değilse toplam üretilmez.
    const totalChange = isComplete ? Object.values(results).reduce((s, r) => s + (r && r.isValid ? r.weightedChange : 0), 0) : 0;
    const years = useMemo(() => generateYearOptions(), []);

    const tariffRows = useMemo(() => {
        const factor = 1 + totalChange / 100;
        const fullFare = appData.TICKET_TYPES.find(t => t.id === FULL_FARE_TICKET_ID);
        const fullRaw = fullFare ? fullFare.price * factor : 0;
        const fullApplied = roundToLira(fullRaw);
        return appData.TICKET_TYPES.map(t => {
            if (t.id === NON_KART43_TICKET_ID && fullFare) {
                const surcharge = nonKart43Surcharge(fullApplied);
                return { ...t, rawPrice: fullRaw + surcharge, newPrice: fullApplied + surcharge };
            }
            const rawPrice = t.price * factor;
            return { ...t, rawPrice, newPrice: roundToLira(rawPrice) };
        });
    }, [appData.TICKET_TYPES, totalChange]);

    if (!auth.isAuth) return <LoginComponent onLogin={handleLogin} />;

    const navItems = [
        { id: 'calc' as const, label: 'Hesaplama ekranı' },
        { id: 'dengeleme' as const, label: 'Tarife dengeleme' },
        ...(auth.isAdmin ? [{ id: 'admin' as const, label: 'Yönetim paneli' }] : []),
    ];

    return (
        <div className="app min-h-screen">
            <div className="app-shell">
                <header className="app-header">
                    <div className="flex items-center justify-between gap-4">
                        <div className="app-brand">
                            <img src={logo} alt="Kütahya Belediyesi logosu" width={60} height={60} />
                            <div>
                                <h1 className="app-title">Eşel Mobil Tarife Hesaplama Sistemi</h1>
                                <p className="app-org">Kütahya Belediyesi · Ulaşım Hizmetleri Müdürlüğü</p>
                            </div>
                        </div>
                        <p className="print-meta sr-only-print">Eşel Mobil Hesaplama Cetveli<br />Düzenlenme tarihi: {today()}</p>
                    </div>

                    <nav className="app-nav print:hidden" aria-label="Ana menü">
                        {navItems.map(item => (
                            <button key={item.id} type="button" className="nav-link" aria-current={view === item.id ? 'page' : undefined} onClick={() => setView(item.id)}>{item.label}</button>
                        ))}
                        <span className="nav-spacer" />
                        <button type="button" className="btn btn--ghost btn--icon" aria-label="Renk temasını değiştir" aria-pressed={isDark} title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'} onClick={() => setIsDark(!isDark)}>
                            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                        </button>
                        <button type="button" className="btn btn--danger" onClick={handleLogout}><LogOut aria-hidden="true" />Çıkış</button>
                    </nav>
                </header>

                <main key={view} className="view-enter">
                    {view === 'admin' ? (
                        <AdminPanel data={appData} onUpdate={d => { setAppData(d); localStorage.setItem('appConstants', JSON.stringify(d)); }} />
                    ) : view === 'dengeleme' ? (
                        <TarifeDengeleme defaultIncreaseRate={totalChange > 0 ? totalChange : 0} />
                    ) : (
                        <div className="calculation-layout">
                            <section className="panel decision-band" aria-label="Hesaplamaya esas karar bilgileri">
                                <dl>
                                    <div><dt>Son hesaplama tarihi</dt><dd>{DECISION.calculationDate}</dd></div>
                                    <div><dt>Esas yakıt fiyatı</dt><dd>{formatNumber(DECISION.fuelPrice)} TL <small>{DECISION.fuelSource}</small></dd></div>
                                    <div><dt>Encümen kararı</dt><dd>{DECISION.councilDecisionDate} <small>{DECISION.councilDecisionNo} sayılı karar</small></dd></div>
                                    <div><dt>Tarife yürürlük tarihi</dt><dd>{DECISION.effectiveDate}</dd></div>
                                </dl>
                                <p>TÜFE baz yılı: {DECISION.tufeBase}</p>
                            </section>

                            <div className="section-title">
                                <h2>Hesaplama parametreleri</h2>
                                <p>Başlangıç ve bitiş dönemlerini karşılaştırarak maliyet değişimini hesaplayın.</p>
                            </div>

                            <div className="parameter-grid">
                                <InputSection title="Yakıt (motorin) fiyatı" tone="fuel" data={inputs.fuel} onDataChange={(f, v) => handleInput('fuel', f, v)} currency years={years} infoLink={{ url: 'https://tppd.com.tr', text: 'TPPD fiyatları', label: 'TPPD akaryakıt fiyatları (yeni sekmede açılır)' }} />
                                <InputSection title="Tüketici fiyat endeksi" tone="tufe" hint="Ay ve yıl seçildiğinde endeks değeri TÜİK verisinden otomatik doldurulur." data={inputs.tufe} onDataChange={(f, v) => handleInput('tufe', f, v)} years={years} />
                                <InputSection title="Asgari ücret" tone="wage" hint="Yıl seçildiğinde o yılın asgari ücreti otomatik doldurulur." data={inputs.wage} onDataChange={(f, v) => handleInput('wage', f, v)} currency years={years} />
                            </div>

                            <div className="parameter-actions print:hidden">
                                {calcError && <p className="alert alert--danger" role="alert"><AlertTriangle aria-hidden="true" />{calcError}</p>}
                                <button type="button" onClick={handleReset} className="btn btn--secondary">Sıfırla</button>
                                <button type="button" onClick={calculate} className="btn btn--primary"><Calculator aria-hidden="true" />Senaryoyu hesapla</button>
                            </div>

                            {hasResults && (
                                <div className="result-grid">
                                    <ResultCard title="Yakıt sonucu" tone="fuel" data={inputs.fuel} result={results.fuel} weight={appData.WEIGHTS.fuel} />
                                    <ResultCard title="TÜFE sonucu" tone="tufe" data={inputs.tufe} result={results.tufe} weight={appData.WEIGHTS.tufe} />
                                    <ResultCard title="Asgari ücret sonucu" tone="wage" data={inputs.wage} result={results.wage} weight={appData.WEIGHTS.wage} />
                                </div>
                            )}

                            <div className="calculation-output">
                                {hasResults && !isComplete ? (
                                    <div className="alert alert--warning" role="alert">
                                        <AlertTriangle aria-hidden="true" />
                                        <span>
                                            <strong>Ağırlıklı toplam hesaplanmadı.</strong> {missingCategories.map(cat => CATEGORY_LABELS[cat]).join(', ')} için başlangıç ve bitiş değerleri eksik.
                                            Tüm kalemler tamamlanmadan toplam değişim ve tarife yansımaları üretilmez.
                                        </span>
                                    </div>
                                ) : isComplete ? (
                                    <div className="space-y-6">
                                        <section className="total-summary" aria-labelledby="total-heading">
                                            <h2 id="total-heading">Ağırlıklı toplam değişim</h2>
                                            <p>Yakıt, TÜFE ve asgari ücret değişimlerinin ağırlıklı toplamı.</p>
                                            <p className="total-value">{formatSigned(totalChange)}%</p>
                                        </section>

                                        <section className="panel tariff-comparison" aria-labelledby="tariff-heading">
                                            <div className="table-heading">
                                                <div>
                                                    <h2 id="tariff-heading">Tarife yansımaları</h2>
                                                    <p>Mevcut tarife ile hesaplanan senaryonun karşılaştırması. Tutarlar TL cinsindendir.</p>
                                                </div>
                                                <button type="button" onClick={() => window.print()} className="btn btn--primary print:hidden"><Printer aria-hidden="true" />Yazdır</button>
                                            </div>
                                            <p className="comparison-hint scroll-hint">Tüm ücretleri görmek için tabloyu sağa kaydırın.</p>
                                            <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Tarife karşılaştırma tablosu">
                                                <table>
                                                    <thead><tr><th scope="col">Biniş türü</th><th scope="col">Mevcut ücret</th><th scope="col">Hesaplanan ücret</th><th scope="col">Uygulanacak ücret</th><th scope="col">Değişim</th></tr></thead>
                                                    <tbody>{tariffRows.map(t => {
                                                        const diff = t.newPrice - t.price;
                                                        const percentChange = (diff / t.price) * 100;
                                                        return (
                                                            <tr key={t.id}>
                                                                <th scope="row">{t.name}</th>
                                                                <td data-label="Mevcut ücret">{formatNumber(t.price)}</td>
                                                                <td data-label="Hesaplanan ücret">{formatNumber(t.rawPrice)}</td>
                                                                <td data-label="Uygulanacak ücret" className="applied-price">{formatNumber(t.newPrice)}</td>
                                                                <td data-label="Değişim">{diff >= 0 ? '+' : ''}{formatNumber(diff)}<small>{percentChange >= 0 ? '+' : ''}%{formatNumber(percentChange)}</small></td>
                                                            </tr>
                                                        );
                                                    })}</tbody>
                                                </table>
                                            </div>
                                            <p className="table-footnote">Uygulanacak ücret, hesaplanan ücretin Meclis kararına göre tam TL'ye yuvarlanmış halidir; tek başına yeni bir tarife kararı değildir. Kart-43 dışındaki kartlarla biniş ücreti, tam bilet uygulanacak ücretine EÜTS ek ücret tablosundaki tutar eklenerek bulunur.</p>
                                        </section>
                                    </div>
                                ) : (
                                    <div className="panel empty-state">
                                        <Calculator aria-hidden="true" />
                                        <h3>Henüz hesaplama yapılmadı</h3>
                                        <p>Dönem değerlerini kontrol edip "Senaryoyu hesapla" düğmesine bastığınızda sonuçlar ve tarife yansımaları burada görünür.</p>
                                    </div>
                                )}
                            </div>

                            <section aria-labelledby="calculation-notes-title" className="panel notes">
                                <h2 id="calculation-notes-title">Notlar</h2>
                                <ol>
                                    <li>03.09.2025 tarihli ve 247 sayılı Belediye Meclis kararına istinaden, Halk otobüsleri fiyat tarifesi değişikliklerinin Eşel Mobil Sistemine göre yapılmasına karar verilmiştir.</li>
                                    <li>01.04.2026 tarihli ve 143 sayılı Belediye Meclis kararına istinaden, hazırlanan tarifelerin görüşülmesi ve onaylanması hususunda Belediye Encümenine yetki verilmiştir.</li>
                                    <li>01.04.2026 tarihli ve 143 sayılı Belediye Meclis kararına istinaden, hesaplanan tarife bedellerinde küsuratın 0,5 ve üzerinde olması durumunda bir üst tam TL'ye, 0,5 TL'nin altında olması durumunda ise bir alt tam TL'ye yuvarlanması gerekmektedir.</li>
                                    <li>
                                        EÜTS Teknik Şartnamesi kapsamında, Kart 43 sistem kartları dışındaki kartlarla yapılan binişlerde uygulanacak ücret, hattın tam ücretine ücret aralığına göre belirlenen ek ücret ilave edilerek hesaplanır (örneğin tam ücret 38,00 TL ise 38,00 + 8,00 = 46,00 TL).
                                        <details className="no-print">
                                            <summary>Ek ücret tablosunu göster</summary>
                                            <SurchargeTable />
                                        </details>
                                        <div className="print-only"><SurchargeTable /></div>
                                    </li>
                                    <li>Mazot maliyetinin hesaplanmasında, tabloda yer alan firmalar tarafından sunulan fiyatlar karşılaştırılmış ve hesaplamaya esas olmak üzere en düşük birim fiyat dikkate alınmıştır.</li>
                                </ol>
                            </section>

                            <div className="signature-block" aria-hidden="true">
                                <div>Hazırlayan</div>
                                <div>Kontrol Eden</div>
                                <div>Onaylayan</div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
