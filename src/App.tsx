import React, { useState, useMemo } from 'react';
import logo from '../image_3ab9b2f9-e025-42e7-aa6b-8255c6443aaf.png';
import constants from './data/constants.json';

const { TUIK_MOCK_DATA: INITIAL_TUIK, ASGARI_UCRET_MOCK_DATA: INITIAL_WAGE, WEIGHTS: INITIAL_WEIGHTS, TICKET_TYPES: INITIAL_TICKETS } = constants as any;

// --- ICON COMPONENTS ---
const Calculator = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>
);
const TrendingUp = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
const TrendingDown = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>
);
const Minus = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /></svg>
);
const Sun = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);
const Moon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);
const Info = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
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
interface CalculationResult { change: number; weightedChange: number; isValid: boolean; error?: string; }
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-indigo-800 dark:text-indigo-400">Yönetim Paneli</h2>
            <div className="flex flex-wrap space-x-2 sm:space-x-4 mb-6 border-b dark:border-slate-700">
                {[
                    {id: 'tufe', label: 'TÜFE'}, 
                    {id: 'wage', label: 'Asgari Ücret'}, 
                    {id: 'weights', label: 'Ağırlıklar'}, 
                    {id: 'tickets', label: 'Tarifeler'}
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-2 px-2 sm:px-4 capitalize text-xs sm:text-sm ${activeTab === tab.id ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            {activeTab === 'tufe' || activeTab === 'wage' ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
                        <input type="text" placeholder="Key (Örn: 2026-02)" value={keys[activeTab]} onChange={e => setKeys({...keys, [activeTab]: e.target.value})} className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded" />
                        <input type="number" step="0.01" placeholder="Değer" value={vals[activeTab]} onChange={e => setVals({...vals, [activeTab]: e.target.value})} className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded" />
                        <button onClick={() => handleUpdate(activeTab as any, keys[activeTab], vals[activeTab])} className="bg-indigo-600 text-white rounded p-2">Güncelle / Ekle</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto border dark:border-slate-700 rounded p-2">
                        {Object.entries(newData[activeTab === 'tufe' ? 'TUIK_MOCK_DATA' : 'ASGARI_UCRET_MOCK_DATA']).sort().reverse().map(([k, v]: any) => (
                            <div key={k} className="flex justify-between items-center border-b dark:border-slate-700 py-2 px-2 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <span className="dark:text-gray-300">{k}</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{v.toLocaleString('tr-TR')}</span>
                                    <button onClick={() => { setKeys({...keys, [activeTab]: k}); setVals({...vals, [activeTab]: v.toString()}); }} className="text-blue-500 text-sm">Düzenle</button>
                                    <button onClick={() => handleDelete(activeTab as any, k)} className="text-red-500 text-sm">Sil</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'weights' ? (
                <div className="space-y-4 p-4 dark:text-gray-300">
                    {['fuel', 'tufe', 'wage'].map(w => (
                        <div key={w} className="flex items-center justify-between">
                            <label className="capitalize">{w === 'fuel' ? 'Yakıt' : w === 'tufe' ? 'TÜFE' : 'Asgari Ücret'} (%):</label>
                            <input type="number" step="0.01" value={newData.WEIGHTS[w]} onChange={e => {
                                const updated = { ...newData, WEIGHTS: { ...newData.WEIGHTS, [w]: parseFloat(e.target.value) } };
                                setNewData(updated); onUpdate(updated);
                            }} className="border dark:border-slate-700 dark:bg-slate-800 p-2 rounded w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
                        <input type="text" placeholder="Bilet Adı" value={ticketForm.name} onChange={e => setTicketForm({...ticketForm, name: e.target.value})} className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded" />
                        <input type="number" step="0.01" placeholder="Fiyat" value={ticketForm.price} onChange={e => setTicketForm({...ticketForm, price: e.target.value})} className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded" />
                        <input type="text" placeholder="Not (Opsiyonel)" value={ticketForm.note} onChange={e => setTicketForm({...ticketForm, note: e.target.value})} className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded" />
                        <button onClick={handleTicketUpdate} className="bg-indigo-600 text-white rounded p-2">
                            {ticketForm.id ? 'Güncelle' : 'Ekle'}
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto border dark:border-slate-700 rounded p-2">
                        {newData.TICKET_TYPES.map((t: any) => (
                            <div key={t.id} className="flex flex-wrap justify-between items-center border-b dark:border-slate-700 py-2 px-2 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <div className="flex flex-col">
                                    <span className="font-bold dark:text-gray-300">{t.name}</span>
                                    {t.note && <span className="text-xs text-gray-500">{t.note}</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">₺{t.price}</span>
                                    <button onClick={() => setTicketForm({ id: t.id, name: t.name, price: t.price.toString(), note: t.note || '' })} className="text-blue-500 text-sm">Düzenle</button>
                                    <button onClick={() => handleTicketDelete(t.id)} className="text-red-500 text-sm">Sil</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function InputSection({ title, data, onDataChange, color, infoLink, years }: any) {
    const colorClass = color === 'orange' ? 'bg-orange-500' : color === 'blue' ? 'bg-blue-500' : 'bg-green-500';
    const renderPeriod = (p: '1' | '2') => (
        <div className="space-y-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">{p === '1' ? 'İlk Dönem' : 'İkinci Dönem'}</h3>
            <div className="grid grid-cols-2 gap-3">
                <select value={data[`month${p}`]} onChange={e => onDataChange(`month${p}`, e.target.value)} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={data[`year${p}`]} onChange={e => onDataChange(`year${p}`, e.target.value)} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="">Yıl</option>
                    {years.map((y: any) => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <input type="number" step="0.01" value={data[`value${p}`]} onChange={e => onDataChange(`value${p}`, e.target.value)} placeholder={`${title} değeri`} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
        </div>
    );
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border dark:border-slate-700">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold dark:text-white flex items-center"><div className={`w-3 h-3 ${colorClass} rounded-full mr-3`}></div>{title}</h2>
                {infoLink && <a href={infoLink.url} target="_blank" className="text-red-500 text-sm ml-6 underline">{infoLink.text}</a>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderPeriod('1')}{renderPeriod('2')}</div>
        </div>
    );
}

function ResultCard({ title, data, result, valueType, weightedLabel, color, tooltip }: any) {

    if (!result.isValid) return <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center">{title}: {result.error}</div>;

    const colorClass = color === 'orange' ? 'bg-orange-500' : color === 'blue' ? 'bg-blue-500' : 'bg-green-500';

    return (

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-indigo-50 dark:border-slate-700 text-center flex flex-col items-center">

            <div className="flex items-center mb-4">

                <div className={`w-3 h-3 ${colorClass} rounded-full mr-3`}></div>

                <h3 className="text-xl font-semibold dark:text-white">{title}</h3>

                {result.change > 0 ? <TrendingUp className="text-red-500 ml-2"/> : <TrendingDown className="text-green-500 ml-2"/>}

            </div>

            <div className="space-y-4 w-full">

                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">

                    {MONTH_NAMES[data.month1]} {data.year1} - {MONTH_NAMES[data.month2]} {data.year2}

                </div>

                

                <div className="flex flex-col items-center justify-center py-2">

                    <span className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center">

                        {weightedLabel}

                        <Tooltip text={tooltip} />

                    </span>

                    <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">

                        %<CountUp end={Math.abs(result.weightedChange)} />

                    </div>

                </div>



                <div className="pt-2 border-t dark:border-slate-700">

                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{valueType} Değişimi</div>

                    <div className="text-lg font-bold dark:text-white opacity-80">

                        %<CountUp end={Math.abs(result.change)} />

                    </div>

                </div>

            </div>

        </div>

    );

}

function LoginComponent({ onLogin, error }: any) {
    const [u, setU] = useState(''); const [p, setP] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(u, p);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border dark:border-slate-700 text-center">
                <img src={logo} className="w-20 mx-auto mb-4" />
                <h2 className="text-2xl font-bold dark:text-white mb-6">EŞEL MOBİL GİRİŞ</h2>
                <input type="text" placeholder="Kullanıcı Adı" value={u} onChange={e => setU(e.target.value)} className="w-full mb-4 p-3 border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                <input type="password" placeholder="Şifre" value={p} onChange={e => setP(e.target.value)} className="w-full mb-6 p-3 border dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                {error && <p className="text-red-500 mb-4 bg-red-50 dark:bg-red-900/20 py-2 rounded">{error}</p>}
                <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all">Giriş Yap</button>
            </form>
        </div>
    );
}

function App() {
    const [appData, setAppData] = useState(INITIAL_TUIK ? { TUIK_MOCK_DATA: INITIAL_TUIK, ASGARI_UCRET_MOCK_DATA: INITIAL_WAGE, WEIGHTS: INITIAL_WEIGHTS, TICKET_TYPES: INITIAL_TICKETS } : null);
    const [view, setView] = useState<'calc' | 'admin'>('calc');
    const [isDark, setIsDark] = useState(false);
    const [auth, setAuth] = useState({ isAuth: false, isAdmin: false });
    const [inputs, setInputs] = useState<any>({ fuel: {...INITIAL_DATA_STATE}, tufe: {...INITIAL_DATA_STATE}, wage: {...INITIAL_DATA_STATE} });
    const [results, setResults] = useState<any>({});

    React.useEffect(() => {
        const stored = localStorage.getItem('appConstants');
        if (stored) setAppData(JSON.parse(stored));
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') { setIsDark(true); document.documentElement.classList.add('dark'); }
        if (localStorage.getItem('isAuth') === 'true') setAuth({ isAuth: true, isAdmin: localStorage.getItem('isAdmin') === 'true' });
    }, []);

    const handleLogin = (u: string, p: string) => {
        let isAdmin = u === 'eozel' && p === 'ilkem1237';
        let isUser = u === 'ulasim' && p === 'ulasim';
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-4 sm:py-8 px-2 sm:px-4 transition-colors">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8 print:hidden">
                    <div className="flex gap-2">
                        {auth.isAdmin && <button onClick={() => setView(view === 'calc' ? 'admin' : 'calc')} className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 text-sm sm:text-base dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium">{view === 'calc' ? 'Yönetim Paneli' : 'Hesaplama Ekranı'}</button>}
                        <button onClick={() => { setIsDark(!isDark); document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'light' : 'dark'); }} className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">{isDark ? '☀️' : '🌙'}</button>
                    </div>
                    <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800/50 font-bold text-sm sm:text-base hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-sm active:scale-95">Çıkış Yap</button>
                </div>

                {view === 'admin' ? <AdminPanel data={appData} onUpdate={d => { setAppData(d); localStorage.setItem('appConstants', JSON.stringify(d)); }} /> : (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="text-center px-2">
                            <img src={logo} className="w-16 sm:w-20 mx-auto mb-4" />
                            <h1 className="text-xl sm:text-3xl font-bold dark:text-white mb-2 leading-tight">Ulaşım Hizmetleri Müdürlüğü Eşel Mobil Sistemi</h1>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                                En son hesaplama tarihi: 05.01.206, Dikkate Alınan Yakıt Tutarı: 56,14 TL (Lukoil), Meclis Tarihi: 07.01.2026 tarih ve 3 sayılı meclis kararı; Zamlı tarife uygulama tarihi: 14.01.2026; (TÜFE 2025=100)
                            </p>
                        </div>
                        <div className="print:hidden space-y-6 sm:space-y-8">
                            <InputSection title="Yakıt (Mazot) Fiyatı" data={inputs.fuel} onDataChange={(f: any, v: any) => handleInput('fuel', f, v)} color="orange" years={years} infoLink={{url:'https://tppd.com.tr', text:'TPPD'}} />
                            <InputSection title="TÜFE" data={inputs.tufe} onDataChange={(f: any, v: any) => handleInput('tufe', f, v)} color="blue" years={years} />
                            <InputSection title="Asgari Ücret" data={inputs.wage} onDataChange={(f: any, v: any) => handleInput('wage', f, v)} color="green" years={years} />
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button onClick={calculate} className="flex-1 bg-indigo-600 text-white p-4 rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Hesapla</button>
                                <button onClick={handleReset} className="w-full sm:w-auto px-8 py-4 bg-gray-500 text-white rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:bg-gray-600 active:scale-95 transition-all">Temizle</button>
                            </div>
                        </div>
                        {Object.keys(results).length > 0 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <ResultCard title="Yakıt (Mazot) Fiyatı" data={inputs.fuel} result={results.fuel} color="orange" valueType="fiyat" weightedLabel="Ağırlıklı Yakıt" tooltip={`Toplam değişimin %${(appData?.WEIGHTS.fuel * 100).toFixed(0)}'ini oluşturur.`} />
                                    <ResultCard title="TÜFE" data={inputs.tufe} result={results.tufe} color="blue" valueType="endeks" weightedLabel="Ağırlıklı TÜFE" tooltip={`Toplam değişimin %${(appData?.WEIGHTS.tufe * 100).toFixed(0)}'ini oluşturur.`} />
                                    <ResultCard title="Asgari Ücret" data={inputs.wage} result={results.wage} color="green" valueType="ücret" weightedLabel="Ağırlıklı Maaş" tooltip={`Toplam değişimin %${(appData?.WEIGHTS.wage * 100).toFixed(0)}'ini oluşturur.`} />
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-2xl shadow-xl border-2 border-indigo-500 text-center">
                                    <h2 className="text-xl sm:text-2xl font-bold dark:text-white mb-2">Toplam Ağırlıklı Değişim</h2>
                                    <div className="text-4xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-6">%<CountUp end={totalChange} /></div>
                                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4">
                                        <table className="w-full text-left dark:text-gray-300 text-xs sm:text-base min-w-[450px]">
                                            <thead>
                                                <tr className="border-b dark:border-slate-700">
                                                    <th className="py-2">Bilet Türü</th>
                                                    <th className="text-right">Mevcut</th>
                                                    <th className="text-right">Yeni</th>
                                                    <th className="text-right text-indigo-500">Artış (TL)</th>
                                                </tr>
                                            </thead>
                                            <tbody>{appData?.TICKET_TYPES.map((t: any) => {
                                                const newPrice = t.price * (1 + totalChange/100);
                                                const diff = newPrice - t.price;
                                                return (
                                                    <tr key={t.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                        <td className="py-3">{t.name}</td>
                                                        <td className="text-right">₺{t.price.toFixed(2)}</td>
                                                        <td className="text-right font-bold text-indigo-600 dark:text-indigo-400">₺<CountUp end={newPrice} /></td>
                                                        <td className="text-right text-sm text-indigo-500 font-medium">+₺{diff.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}</tbody>
                                        </table>
                                    </div>
                                    <button onClick={() => window.print()} className="mt-8 w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold print:hidden shadow-lg hover:bg-emerald-700 transition-colors">PDF Yazdır</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <p className="mt-12 text-right text-gray-400 italic text-sm">End. Yük. Müh. Emre ÖZEL</p>
            </div>
        </div>
    );
}

export default App;
