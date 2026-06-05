import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../image_3ab9b2f9-e025-42e7-aa6b-8255c6443aaf.png';
import constants from './data/constants.json';
import TarifeDengeleme from './TarifeDengeleme';

const { TUIK_MOCK_DATA: INITIAL_TUIK, ASGARI_UCRET_MOCK_DATA: INITIAL_WAGE, WEIGHTS: INITIAL_WEIGHTS, TICKET_TYPES: INITIAL_TICKETS } = constants as any;

// --- ICON COMPONENTS ---
const Calculator = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>
);
const Sun = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
);
const Moon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
);
const Info = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
);

// --- ANIMATION COMPONENT ---
const CountUp = ({ end, decimals = 2, prefix = "", suffix = "" }: { end: number, decimals?: number, prefix?: string, suffix?: string }) => {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        let startTime: number;
        const duration = 1000;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            setCount(easeOutCubic * end);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [end]);
    return <span>{prefix}{count.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

// --- TOOLTIP COMPONENT ---
const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 cursor-help">
        <Info className="text-gray-400 hover:text-indigo-500 transition-colors" />
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 text-center shadow-xl">
            {text}
            <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

// --- TYPES & CONSTANTS ---
interface CalculationData { month1: string; year1: string; value1: string; month2: string; year2: string; value2: string; }
interface CalculationData { month1: string; year1: string; value1: string; month2: string; year2: string; value2: string; }
type CalculationCategory = 'fuel' | 'tufe' | 'wage';
const MONTH_NAMES = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const INITIAL_DATA_STATE: CalculationData = { month1: '', year1: '', value1: '', month2: '', year2: '', value2: '' };

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
};

// --- COMPONENTS ---
function AdminPanel({ data, onUpdate }: { data: any, onUpdate: (newData: any) => void }) {
    const [newData, setNewData] = useState(data);
    const [activeTab, setActiveTab] = useState<'tufe' | 'wage' | 'weights' | 'tickets'>('tufe');
    const [keys, setKeys] = useState({ tufe: '', wage: '' });
    const [vals, setVals] = useState({ tufe: '', wage: '' });
    const [ticketForm, setTicketForm] = useState({ id: '', name: '', price: '', note: '' });

    const handleUpdate = (type: 'tufe' | 'wage', k: string, v: string) => {
        if (!k || !v) return;
        const target = type === 'tufe' ? 'TUIK_MOCK_DATA' : 'ASGARI_UCRET_MOCK_DATA';
        const updated = { ...newData, [target]: { ...newData[target], [k]: parseFloat(v) } };
        setNewData(updated);
        onUpdate(updated);
        setKeys({ ...keys, [type]: '' });
        setVals({ ...vals, [type]: '' });
    };

    const handleDelete = (type: 'tufe' | 'wage', key: string) => {
        const target = type === 'tufe' ? 'TUIK_MOCK_DATA' : 'ASGARI_UCRET_MOCK_DATA';
        const { [key]: _, ...rest } = newData[target];
        const updated = { ...newData, [target]: rest };
        setNewData(updated);
        onUpdate(updated);
    };

    const handleTicketUpdate = () => {
        if (!ticketForm.name || !ticketForm.price) return;
        const id = ticketForm.id || Math.random().toString(36).substr(2, 9);
        const existingIndex = newData.TICKET_TYPES.findIndex((t: any) => t.id === id);
        let updatedTickets = [...newData.TICKET_TYPES];
        const newTicket = { ...ticketForm, id, price: parseFloat(ticketForm.price) };
        if (existingIndex > -1) updatedTickets[existingIndex] = newTicket;
        else updatedTickets.push(newTicket);
        const updated = { ...newData, TICKET_TYPES: updatedTickets };
        setNewData(updated);
        onUpdate(updated);
        setTicketForm({ id: '', name: '', price: '', note: '' });
    };

    const handleTicketDelete = (id: string) => {
        const updated = { ...newData, TICKET_TYPES: newData.TICKET_TYPES.filter((t: any) => t.id !== id) };
        setNewData(updated);
        onUpdate(updated);
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Yönetim Paneli</h2>
            <div className="flex flex-wrap space-x-2 sm:space-x-4 mb-6 border-b border-black/5 dark:border-white/10">
                {[
                    { id: 'tufe', label: 'TÜFE' },
                    { id: 'wage', label: 'Asgari Ücret' },
                    { id: 'weights', label: 'Ağırlıklar' },
                    { id: 'tickets', label: 'Tarifeler' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-3 px-2 sm:px-4 capitalize text-xs sm:text-sm transition-all duration-300 ${activeTab === tab.id ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            {activeTab === 'tufe' || activeTab === 'wage' ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                        <input type="text" placeholder="Key (Örn: 2026-02)" value={keys[activeTab]} onChange={e => setKeys({ ...keys, [activeTab]: e.target.value })} className="bg-transparent border-b border-black/20 dark:border-white/20 dark:text-white p-2 outline-none focus:border-indigo-500 transition-colors" />
                        <input type="number" step="0.01" placeholder="Değer" value={vals[activeTab]} onChange={e => setVals({ ...vals, [activeTab]: e.target.value })} className="bg-transparent border-b border-black/20 dark:border-white/20 dark:text-white p-2 outline-none focus:border-indigo-500 transition-colors" />
                        <button onClick={() => handleUpdate(activeTab as any, keys[activeTab], vals[activeTab])} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2 font-semibold transition-colors shadow-lg shadow-indigo-500/20">Güncelle / Ekle</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-xl p-2 custom-scrollbar">
                        {Object.entries(newData[activeTab === 'tufe' ? 'TUIK_MOCK_DATA' : 'ASGARI_UCRET_MOCK_DATA']).sort().reverse().map(([k, v]: any) => (
                            <div key={k} className="flex justify-between items-center border-b border-black/5 dark:border-white/5 py-3 px-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{k}</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{v.toLocaleString('tr-TR')}</span>
                                    <button onClick={() => { setKeys({ ...keys, [activeTab]: k }); setVals({ ...vals, [activeTab]: v.toString() }); }} className="text-blue-500/80 hover:text-blue-500 text-sm font-medium transition-colors">Düzenle</button>
                                    <button onClick={() => handleDelete(activeTab as any, k)} className="text-red-500/80 hover:text-red-500 text-sm font-medium transition-colors">Sil</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'weights' ? (
                <div className="space-y-6 p-4 text-slate-700 dark:text-slate-300">
                    {['fuel', 'tufe', 'wage'].map(w => (
                        <div key={w} className="flex items-center justify-between group">
                            <label className="capitalize font-medium">{w === 'fuel' ? 'Yakıt' : w === 'tufe' ? 'TÜFE' : 'Asgari Ücret'} (%):</label>
                            <input type="number" step="0.01" value={newData.WEIGHTS[w]} onChange={e => {
                                const updated = { ...newData, WEIGHTS: { ...newData.WEIGHTS, [w]: parseFloat(e.target.value) } };
                                setNewData(updated); onUpdate(updated);
                            }} className="bg-transparent border-b-2 border-black/10 dark:border-white/10 group-hover:border-indigo-500 focus:border-indigo-500 p-2 text-right w-24 outline-none transition-colors" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                        <input type="text" placeholder="Bilet Adı" value={ticketForm.name} onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })} className="bg-transparent border-b border-black/20 dark:border-white/20 dark:text-white p-2 outline-none focus:border-indigo-500 transition-colors" />
                        <input type="number" step="0.01" placeholder="Fiyat" value={ticketForm.price} onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} className="bg-transparent border-b border-black/20 dark:border-white/20 dark:text-white p-2 outline-none focus:border-indigo-500 transition-colors" />
                        <input type="text" placeholder="Not (Opsiyonel)" value={ticketForm.note} onChange={e => setTicketForm({ ...ticketForm, note: e.target.value })} className="bg-transparent border-b border-black/20 dark:border-white/20 dark:text-white p-2 outline-none focus:border-indigo-500 transition-colors" />
                        <button onClick={handleTicketUpdate} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2 font-semibold transition-colors shadow-lg shadow-indigo-500/20">
                            {ticketForm.id ? 'Güncelle' : 'Ekle'}
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-xl p-2 custom-scrollbar">
                        {newData.TICKET_TYPES.map((t: any) => (
                            <div key={t.id} className="flex flex-wrap justify-between items-center border-b border-black/5 dark:border-white/5 py-3 px-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                                    {t.note && <span className="text-xs text-slate-500">{t.note}</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">₺{t.price}</span>
                                    <button onClick={() => setTicketForm({ id: t.id, name: t.name, price: t.price.toString(), note: t.note || '' })} className="text-blue-500/80 hover:text-blue-500 text-sm font-medium transition-colors">Düzenle</button>
                                    <button onClick={() => handleTicketDelete(t.id)} className="text-red-500/80 hover:text-red-500 text-sm font-medium transition-colors">Sil</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function InputSection({ title, data, onDataChange, color, infoLink, years }: any) {
    const colorPairs: any = {
        orange: { border: 'border-[var(--accent-orange)]', text: 'text-[var(--accent-orange)]', bg: 'bg-[var(--accent-orange)]' },
        blue: { border: 'border-[var(--accent-blue)]', text: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]' },
        green: { border: 'border-[var(--accent-green)]', text: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green)]' }
    };
    const c = colorPairs[color] || colorPairs.blue;

    const renderPeriod = (p: '1' | '2') => (
        <div className="space-y-3">
            <h3 className="text-xs tracking-widest font-semibold text-slate-500 dark:text-slate-400">{p === '1' ? 'BAŞLANGIÇ DÖNEMİ' : 'BİTİŞ DÖNEMİ'}</h3>
            <div className="grid grid-cols-2 gap-3">
                <select value={data[`month${p}`]} onChange={e => onDataChange(`month${p}`, e.target.value)} className="w-full bg-black/5 dark:bg-white/5 px-4 py-3 border-none text-slate-800 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer font-medium appearance-none">
                    <option value="" className="text-slate-800">Ay Seçimi</option>
                    {MONTH_NAMES.slice(1).map((m, i) => <option key={i} value={i + 1} className="text-slate-800">{m}</option>)}
                </select>
                <select value={data[`year${p}`]} onChange={e => onDataChange(`year${p}`, e.target.value)} className="w-full bg-black/5 dark:bg-white/5 px-4 py-3 border-none text-slate-800 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer font-medium appearance-none">
                    <option value="" className="text-slate-800">Yıl Seçimi</option>
                    {years.map((y: any) => <option key={y} value={y} className="text-slate-800">{y}</option>)}
                </select>
            </div>
            <div className="relative">
                <input type="number" step="0.01" value={data[`value${p}`]} onChange={e => onDataChange(`value${p}`, e.target.value)} placeholder={`Belirlenen Değer`} className="w-full bg-black/5 dark:bg-white/5 px-4 py-3 border-none text-slate-800 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium" />
                {color === 'orange' && <span className="absolute right-4 top-3 text-sm text-slate-400 font-bold">₺</span>}
            </div>
        </div>
    );
    return (
        <div className={`glass-panel rounded-2xl p-6 sm:p-8 border-l-4 ${c.border} relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${c.bg} opacity-5 blur-[60px] rounded-full point-events-none transition-opacity group-hover:opacity-10 print:hidden`} />
            <div className="mb-6 flex items-center justify-between relative z-10">
                <h2 className={`text-xl font-bold dark:text-white flex items-center tracking-tight`}>
                    {title}
                </h2>
                {infoLink && <a href={infoLink.url} target="_blank" className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-wider">{infoLink.text}</a>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">{renderPeriod('1')}{renderPeriod('2')}</div>
        </div>
    );
}

function ResultCard({ title, data, result, valueType, weightedLabel, color, tooltip }: any) {
    if (!result.isValid) return <div className="glass-panel p-6 rounded-2xl border-l-4 border-red-500 text-red-500 text-center font-medium opacity-50">{title}: {result.error}</div>;

    const colorPairs: any = {
        orange: { text: 'text-[var(--accent-orange)]' },
        blue: { text: 'text-[var(--accent-blue)]' },
        green: { text: 'text-[var(--accent-green)]' }
    };
    const c = colorPairs[color] || colorPairs.blue;

    return (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel rounded-2xl p-6 text-center flex flex-col items-center relative overflow-hidden print:opacity-100 print:transform-none print:!translate-y-0 print:!opacity-100">
            <div className="flex flex-col items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white tracking-tight">{title}</h3>
                <div className="text-[10px] text-slate-500 tracking-widest mt-1 font-semibold">
                    {(MONTH_NAMES[data.month1] || '').toLocaleUpperCase('tr-TR')} {data.year1} — {(MONTH_NAMES[data.month2] || '').toLocaleUpperCase('tr-TR')} {data.year2}
                </div>
            </div>

            <div className="space-y-6 w-full flex-grow flex flex-col justify-center">
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-500 mb-2 flex items-center justify-center font-medium tracking-wider">
                        {(weightedLabel || '').toLocaleUpperCase('tr-TR')} <Tooltip text={tooltip} />
                    </span>
                    <div className={`text-4xl sm:text-5xl font-black ${c.text} tracking-tighter flex items-center`}>
                        {result.weightedChange > 0 ? '+' : ''}<CountUp end={result.weightedChange} />%
                    </div>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/5 relative">
                    <div className="text-[10px] text-slate-400 tracking-widest mb-1 font-semibold">{(valueType || '').toLocaleUpperCase('tr-TR')} SAF DEĞİŞİMİ</div>
                    <div className="text-xl sm:text-2xl font-bold dark:text-white opacity-80 font-mono">
                        {result.change > 0 ? '+' : ''}<CountUp end={result.change} />%
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function LoginComponent({ onLogin, error }: any) {
    const [u, setU] = useState(''); const [p, setP] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(u, p);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0f1115]">
            <div className="bg-noise" />

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm relative z-10">
                <div className="glass-panel p-10 rounded-3xl text-center">
                    <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} src={logo} className="w-24 mx-auto mb-8 drop-shadow-2xl" />

                    <div className="mb-10 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Değerleme Platformu</p>
                        <h2 className="text-2xl sm:text-3xl font-black dark:text-white tracking-tight">Eşel Mobil<span className="text-indigo-500">.</span></h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="Kullanıcı Kodu" value={u} onChange={e => setU(e.target.value)} className="w-full p-4 bg-black/5 dark:bg-white/5 border-none dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium placeholder-slate-400 text-center" />
                        <input type="password" placeholder="Parola" value={p} onChange={e => setP(e.target.value)} className="w-full p-4 bg-black/5 dark:bg-white/5 border-none dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium placeholder-slate-400 text-center" />

                        <AnimatePresence>
                            {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 font-medium text-sm pt-2">{error}</motion.p>}
                        </AnimatePresence>

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full mt-4 bg-indigo-600 text-white p-4 rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all">Sisteme Giriş</motion.button>
                    </form>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-8 font-medium uppercase tracking-widest opacity-60">© 2026 Kütahya Belediyesi</p>
            </motion.div>
        </div>
    );
}

function App() {
    const [appData, setAppData] = useState(INITIAL_TUIK ? { TUIK_MOCK_DATA: INITIAL_TUIK, ASGARI_UCRET_MOCK_DATA: INITIAL_WAGE, WEIGHTS: INITIAL_WEIGHTS, TICKET_TYPES: INITIAL_TICKETS } : null);
    const [view, setView] = useState<'calc' | 'admin' | 'dengeleme'>('calc');
    const [isDark, setIsDark] = useState(false);
    const [auth, setAuth] = useState({ isAuth: false, isAdmin: false });
    const [inputs, setInputs] = useState<any>({ fuel: { ...INITIAL_DATA_STATE }, tufe: { ...INITIAL_DATA_STATE }, wage: { ...INITIAL_DATA_STATE } });
    const [results, setResults] = useState<any>({});

    React.useEffect(() => {
        const stored = localStorage.getItem('appConstants');
        if (stored) {
            const parsed = JSON.parse(stored);
            let changed = false;
            if (INITIAL_TUIK && parsed.TUIK_MOCK_DATA) {
                for (const key of Object.keys(INITIAL_TUIK)) {
                    if (parsed.TUIK_MOCK_DATA[key] === undefined) {
                        parsed.TUIK_MOCK_DATA[key] = INITIAL_TUIK[key];
                        changed = true;
                    }
                }
            }
            if (INITIAL_WAGE && parsed.ASGARI_UCRET_MOCK_DATA) {
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
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') { setIsDark(true); document.documentElement.classList.add('dark'); }
        if (localStorage.getItem('isAuth') === 'true') setAuth({ isAuth: true, isAdmin: localStorage.getItem('isAdmin') === 'true' });
    }, []);

    const handleLogin = (u: string, p: string) => {
        let isAdmin = u === import.meta.env.VITE_ADMIN_USER && p === import.meta.env.VITE_ADMIN_PASS;
        let isUser = u === import.meta.env.VITE_USER && p === import.meta.env.VITE_USER_PASS;
        if (isAdmin || isUser) {
            localStorage.setItem('isAuth', 'true'); localStorage.setItem('isAdmin', isAdmin.toString());
            setAuth({ isAuth: true, isAdmin });
        } else alert('Hatalı giriş!');
    };

    const handleInput = (cat: CalculationCategory, f: string, v: string) => {
        const newData = { ...inputs[cat], [f]: v };
        if (cat === 'tufe' && ['month1', 'year1', 'month2', 'year2'].includes(f)) {
            const k1 = `${newData.year1}-${newData.month1.padStart(2, '0')}`;
            const k2 = `${newData.year2}-${newData.month2.padStart(2, '0')}`;
            if (newData.month1 && newData.year1) newData.value1 = appData?.TUIK_MOCK_DATA[k1] || '';
            if (newData.month2 && newData.year2) newData.value2 = appData?.TUIK_MOCK_DATA[k2] || '';
        }
        if (cat === 'wage' && ['year1', 'year2'].includes(f)) {
            if (newData.year1) newData.value1 = appData?.ASGARI_UCRET_MOCK_DATA[newData.year1] || '';
            if (newData.year2) newData.value2 = appData?.ASGARI_UCRET_MOCK_DATA[newData.year2] || '';
        }
        setInputs({ ...inputs, [cat]: newData });
    };

    const calculate = () => {
        const validateDates = (data: any) => {
            if (!data.year1 || !data.month1 || !data.year2 || !data.month2) return true; // Let the 'missing data' check handle this
            const d1 = parseInt(data.year1) * 12 + parseInt(data.month1);
            const d2 = parseInt(data.year2) * 12 + parseInt(data.month2);
            return d2 > d1;
        };

        if (!validateDates(inputs.fuel) || !validateDates(inputs.tufe) || !validateDates(inputs.wage)) {
            alert('İkinci dönem tarihi, birinci dönem tarihinden sonra olmalıdır!');
            return;
        }

        const calc = (data: any, w: number) => {
            const v1 = parseFloat(data.value1), v2 = parseFloat(data.value2);
            if (!v1 || !v2) return { isValid: false, error: 'Eksik veri' };
            const change = ((v2 - v1) / v1) * 100;
            return { change, weightedChange: change * w, isValid: true };
        };
        setResults({
            fuel: calc(inputs.fuel, appData!.WEIGHTS.fuel),
            tufe: calc(inputs.tufe, appData!.WEIGHTS.tufe),
            wage: calc(inputs.wage, appData!.WEIGHTS.wage)
        });
    };

    const handleReset = () => {
        setInputs({ fuel: { ...INITIAL_DATA_STATE }, tufe: { ...INITIAL_DATA_STATE }, wage: { ...INITIAL_DATA_STATE } });
        setResults({});
    };

    const totalChange = Object.values(results).reduce((s: number, r: any) => s + (r.weightedChange || 0), 0);
    const years = useMemo(() => generateYearOptions(), []);

    if (!auth.isAuth) return <LoginComponent onLogin={handleLogin} />;

    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { ease: "easeOut" as const, duration: 0.5 } }
    };

    return (
        <div className="min-h-screen relative overflow-hidden transition-colors duration-500">
            <div className="bg-noise" />

            <div className="max-w-[1400px] mx-auto p-4 sm:p-8 relative z-10">
                <header className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:items-start md:items-center mb-8 sm:mb-12 backdrop-blur-md bg-white/30 dark:bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/20 dark:border-white/5">
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
                        <img src={logo} className="w-12 h-12 sm:w-16 sm:h-16" alt="Logo" />
                        <div className="text-center sm:text-left">
                            <h1 className="text-xl sm:text-3xl font-black dark:text-white tracking-tight">Eşel Mobil <span className="text-indigo-500">Sistemi</span></h1>
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-widest mt-1">ULAŞIM HİZMETLERİ MÜDÜRLÜĞÜ</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end print:hidden">
                        <button onClick={() => setView('calc')} className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm dark:text-white transition-all ${view === 'calc' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20'}`}>Hesaplama Ekranı</button>
                        <button onClick={() => setView('dengeleme')} className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm dark:text-white transition-all ${view === 'dengeleme' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20'}`}>Tarife Dengeleme</button>
                        {auth.isAdmin && <button onClick={() => setView('admin')} className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm dark:text-white transition-all ${view === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20'}`}>Yönetim Paneli</button>}
                        <button onClick={() => { setIsDark(!isDark); document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'light' : 'dark'); }} className="bg-white/80 dark:bg-white/10 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-white/20 transition-all">{isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4" />}</button>
                        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all">Çıkış</button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {view === 'admin' ? (
                        <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AdminPanel data={appData} onUpdate={d => { setAppData(d); localStorage.setItem('appConstants', JSON.stringify(d)); }} /></motion.div>
                    ) : view === 'dengeleme' ? (
                        <motion.div key="dengeleme" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><TarifeDengeleme defaultIncreaseRate={totalChange > 0 ? totalChange : 0} /></motion.div>
                    ) : (
                        <motion.div key="calc" variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:flex print:flex-col print:opacity-100 print:transform-none">

                            {/* INFORMATION NOTE */}
                            <motion.div variants={fadeUp} className="lg:col-span-12 mb-4 text-[10px] sm:text-xs font-medium text-slate-500 bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 text-center leading-relaxed print:hidden">
                                <p>En son hesaplama tarihi: 01.04.2026, Dikkate Alınan Yakıt Tutarı: 79,30 TL (Aytemiz), Meclis Tarihi: 01.04.2026 tarih ve 143 sayılı meclis kararı; Zamlı tarife uygulama tarihi: 08.04.2026; (TÜFE 2025=100)</p>
                                <p className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold">01.04.2026 tarihli ve 143 sayılı Belediye Meclis kararına istinaden, hesaplanan tarife bedellerinde küsuratın 0,5 ve üzerinde olması durumunda bir üst tam TL'ye, 0,5 TL'nin altında olması durumunda ise bir alt tam TL'ye yuvarlanması gerekmektedir.</p>
                            </motion.div>

                            {/* LEFT PANEL - INPUTS & RESULTS */}
                            <motion.div variants={fadeUp} className="lg:col-span-8 space-y-6 print:opacity-100 print:transform-none print:!translate-y-0 print:block">
                                <div className="space-y-6 print:hidden">
                                    <InputSection title="Yakıt (Mazot) Fiyatı" data={inputs.fuel} onDataChange={(f: any, v: any) => handleInput('fuel', f, v)} color="orange" years={years} infoLink={{ url: 'https://tppd.com.tr', text: 'TPPD' }} />
                                    <div className="space-y-6">
                                        <InputSection title="Tüketici Fiyat Endeksi" data={inputs.tufe} onDataChange={(f: any, v: any) => handleInput('tufe', f, v)} color="blue" years={years} />
                                        <InputSection title="Asgari Ücret" data={inputs.wage} onDataChange={(f: any, v: any) => handleInput('wage', f, v)} color="green" years={years} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                        <button onClick={calculate} className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white p-5 rounded-2xl font-bold text-xl tracking-wide shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-95 transition-all">Senaryoyu Hesapla</button>
                                        <button onClick={handleReset} className="px-8 py-5 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-bold tracking-wide hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all">Sıfırla</button>
                                    </div>
                                </div>

                                {Object.keys(results).length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                                        <ResultCard title="Yakıt Sonucu" data={inputs.fuel} result={results.fuel || {}} valueType="Yakıt" color="orange" weightedLabel={`Ağırlık: %${appData?.WEIGHTS.fuel}`} />
                                        <ResultCard title="TÜFE Sonucu" data={inputs.tufe} result={results.tufe || {}} valueType="TÜFE" color="blue" weightedLabel={`Ağırlık: %${appData?.WEIGHTS.tufe}`} />
                                        <ResultCard title="Asgari Ücret Skoru" data={inputs.wage} result={results.wage || {}} valueType="Asgari Ücret" color="green" weightedLabel={`Ağırlık: %${appData?.WEIGHTS.wage}`} />
                                    </div>
                                )}
                            </motion.div>

                            {/* RIGHT PANEL - RESULTS */}
                            <motion.div variants={fadeUp} className="lg:col-span-4 lg:row-span-2 print:opacity-100 print:transform-none print:!translate-y-0 print:block">
                                {Object.keys(results).length > 0 ? (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="sticky top-8 space-y-6 h-full flex flex-col print:opacity-100 print:transform-none print:!translate-x-0 print:block">

                                        {/* HERO TOTAL CARD */}
                                        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] text-center border-t-4 border-indigo-500 relative overflow-hidden flex-shrink-0 print:opacity-100 print:transform-none">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none print:hidden" />
                                            <h2 className="text-xs sm:text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-2 sm:mb-4">AĞIRLIKLI TOPLAM SONUÇ</h2>
                                            <div className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                                                {totalChange > 0 ? '+' : ''}<CountUp end={totalChange} />%
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">Sistem parametrelerine göre hesaplanmış net değişim oranı.</p>
                                        </div>

                                        {/* TICKET TABLE */}
                                        <div className="glass-panel p-6 rounded-3xl flex-grow overflow-hidden flex flex-col">
                                            <h3 className="text-sm font-bold tracking-widest text-slate-500 mb-6">TARİFE YANSIMALARI</h3>
                                            <div className="overflow-y-auto custom-scrollbar flex-grow pr-2">
                                                <div className="space-y-3">
                                                    {appData?.TICKET_TYPES.map((t: any) => {
                                                        const rawPrice = t.price * (1 + totalChange / 100);
                                                        const newPrice = Math.round(rawPrice);
                                                        const diff = newPrice - t.price;
                                                        const percentChange = ((newPrice - t.price) / t.price) * 100;
                                                        return (
                                                            <motion.div key={t.id} whileHover={{ x: 4 }} className="group p-3 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex justify-between items-center border border-transparent hover:border-indigo-500/20">
                                                                <div>
                                                                    <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">{t.name}</div>
                                                                    <div className="text-[10px] sm:text-xs text-slate-400 font-medium line-through">₺{t.price.toFixed(2)}</div>
                                                                </div>
                                                                <div className="text-right flex flex-col items-end justify-center">
                                                                    <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Hesaplanan: ₺{rawPrice.toFixed(2)}</div>
                                                                    <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none flex items-center">
                                                                        ₺<CountUp end={newPrice} />
                                                                    </div>
                                                                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 mt-1 uppercase">
                                                                        Değişim: {diff >= 0 ? '+' : ''}₺{diff.toFixed(2)} ({percentChange >= 0 ? '+' : ''}%{percentChange.toFixed(1)})
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <button onClick={() => window.print()} className="w-full mt-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl font-bold tracking-wide shadow-xl active:scale-95 transition-all print:hidden">Yazıcıya Gönder</button>
                                        </div>

                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center glass-panel rounded-[2rem] opacity-50 border-dashed border-2">
                                        <Calculator className="w-16 h-16 text-slate-300 mb-6" />
                                        <h3 className="text-lg font-bold text-slate-400 mb-2">Sonuç Bekleniyor</h3>
                                        <p className="text-sm text-slate-500 font-medium">Maliyet değişimlerini görmek için dönemsel verileri girip senaryoyu hesaplayın.</p>
                                    </div>
                                )}
                            </motion.div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default App;
