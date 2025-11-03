import React, { useState, useMemo } from 'react';
import logo from '../image_3ab9b2f9-e025-42e7-aa6b-8255c6443aaf.png';

// --- ICON COMPONENTS (replaces lucide-react) ---
// In a real build environment, you would import these from 'lucide-react'
// e.g., import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';
const Calculator = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />
    </svg>
);
const TrendingUp = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
);
const TrendingDown = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" />
    </svg>
);
const Minus = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
    </svg>
);

// --- TYPE DEFINITIONS ---
interface CalculationData {
    month1: string;
    year1: string;
    value1: string;
    month2: string;
    year2: string;
    value2: string;
}

interface CalculationResult {
    change: number;
    weightedChange: number;
    isValid: boolean;
    error?: string;
}

type CalculationCategory = 'fuel' | 'tufe' | 'wage';

// --- CONSTANTS ---
const MONTH_NAMES = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const TUIK_MOCK_DATA: { [key: string]: number } = {
    '2024-01': 1984.02, '2024-02': 2073.88, '2024-03': 2139.47, '2024-04': 2207.50,
    '2024-05': 2281.85, '2024-06': 2319.29, '2024-07': 2394.10, '2024-08': 2453.34, '2024-09': 2526.16, '2024-10': 2598.91, '2024-11': 2657.23, '2024-12': 2684.55,
    '2025-01': 2819.65, '2025-02': 2883.75, '2025-03': 2954.69, '2025-04': 3043.23, '2025-05': 3089.74, '2025-06': 3132.17, '2025-07': 3196.66, '2025-08': 3261.72,
    '2025-09': 3367.22, '2025-10': 3453.09,
};

const ASGARI_UCRET_MOCK_DATA: { [key: string]: number } = {
    '2025': 22104,
};

const WEIGHTS = {
    fuel: 0.34,
    tufe: 0.33,
    wage: 0.33,
};

const INITIAL_DATA_STATE: CalculationData = {
    month1: '', year1: '', value1: '', month2: '', year2: '', value2: ''
};

// --- HELPER FUNCTIONS ---
const generateYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
};

// --- REUSABLE COMPONENTS ---
function InputSection({ title, data, onDataChange, color, infoLink, years }: { title: string, data: CalculationData, onDataChange: (field: keyof CalculationData, value: string) => void, color: 'orange' | 'blue' | 'green', infoLink?: { url: string; text: string; }, years: number[] }) {
    const colorClasses = {
        orange: 'bg-orange-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
    };

    const renderPeriodInputs = (period: '1' | '2') => (
        <div className="space-y-4">
            <h3 className="font-medium text-gray-700">{period === '1' ? 'İlk Dönem' : 'İkinci Dönem'}</h3>
            <div className="grid grid-cols-2 gap-3">
                <select
                    value={data[`month${period}`]}
                    onChange={(e) => onDataChange(`month${period}`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((month, index) => (
                        <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                </select>
                <select
                    value={data[`year${period}`]}
                    onChange={(e) => onDataChange(`year${period}`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Yıl</option>
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>
            <input
                type="number"
                step="0.01"
                value={data[`value${period}`]}
                onChange={(e) => onDataChange(`value${period}`, e.target.value)}
                placeholder={`${title} değeri`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 transition-shadow hover:shadow-xl">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <div className={`w-3 h-3 ${colorClasses[color]} rounded-full mr-3 flex-shrink-0`}></div>
                    <span>{title}</span>
                </h2>
                {infoLink && (
                    <p className="text-red-500 italic text-sm font-normal pl-6">
                        (
                        <a
                            href={infoLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-red-700"
                        >
                            {infoLink.text}
                        </a>
                        )
                    </p>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderPeriodInputs('1')}
                {renderPeriodInputs('2')}
            </div>
        </div>
    );
}

function ResultCard({ title, data, result, valueType, weightedLabel, color }: { title: string, data: CalculationData, result: CalculationResult, valueType: string, weightedLabel: string, color: 'orange' | 'blue' | 'green' }) {
    const getFullName = (month: string, year: string) => {
        const monthName = MONTH_NAMES[parseInt(month)];
        return (monthName && year) ? `${monthName} ${year}` : '';
    };

    const getStatusIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-5 h-5 text-red-500 ml-2" />;
        if (change < 0) return <TrendingDown className="w-5 h-5 text-green-500 ml-2" />;
        return <Minus className="w-5 h-5 text-gray-500 ml-2" />;
    };

    const getStatusColor = (change: number) => {
        if (change > 0) return 'border-red-200 bg-red-50';
        if (change < 0) return 'border-green-200 bg-green-50';
        return 'border-gray-200 bg-gray-50';
    };

    const colorClasses = {
        orange: 'bg-orange-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500'
    };

    if (!result.isValid) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200 bg-red-50">
                <div className="flex items-center mb-4">
                    <div className={`w-3 h-3 ${colorClasses[color]} rounded-full mr-3`}></div>
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                </div>
                <div className="text-red-600 font-medium">{result.error}</div>
            </div>
        );
    }

    const fullName1 = getFullName(data.month1, data.year1);
    const fullName2 = getFullName(data.month2, data.year2);
    const changeText = result.change > 0 ? `${valueType} artışı` : `${valueType} düşüşü`;

    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getStatusColor(result.change)} transition-all duration-300`}>
            <div className="flex items-center mb-4">
                <div className={`w-3 h-3 ${colorClasses[color]} rounded-full mr-3`}></div>
                <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                {getStatusIcon(result.change)}
            </div>

            <div className="space-y-3">
                <div className="text-gray-700">
                    <strong>{fullName1}</strong> & <strong>{fullName2}</strong> arası {changeText}:
                </div>
                <div className="text-3xl font-bold text-gray-900">
                    %{Math.abs(result.change).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 bg-gray-100 rounded-lg p-3">
                    {weightedLabel}: <span className="font-semibold">%{Math.abs(result.weightedChange).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}

function LoginComponent({ onLogin, error }: { onLogin: (user: string, pass: string) => void, error: string }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="text-center mb-8">
                    <img src={logo} alt="Kütahya Belediyesi logosu" className="w-16 h-16 mx-auto mb-2 object-contain" />
                    <Calculator className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800">EŞEL MOBİL SİSTEMİ GİRİŞ</h2>
                    <p className="text-gray-500 mt-2">Lütfen devam etmek için giriş yapın.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
}

function App() {
    const [inputs, setInputs] = useState<{ [key in CalculationCategory]: CalculationData }>({
        fuel: { ...INITIAL_DATA_STATE },
        tufe: { ...INITIAL_DATA_STATE },
        wage: { ...INITIAL_DATA_STATE },
    });

    const [results, setResults] = useState<{ [key in CalculationCategory]?: CalculationResult }>({});
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
    const [loginError, setLoginError] = useState('');
    const [baseTicketPrice, setBaseTicketPrice] = useState(25.00);

    const handleLogin = (username, password) => {
        if (username === 'ulasim' && password === 'ulasim') {
            localStorage.setItem('isAuthenticated', 'true');
            setIsAuthenticated(true);
            setLoginError('');
        } else {
            setLoginError('Hatalı kullanıcı adı veya şifre.');
        }
    };

    const years = useMemo(() => generateYearOptions(), []);

    const handleInputChange = (
        category: CalculationCategory,
        field: keyof CalculationData,
        value: string
    ) => {
        setInputs(prevInputs => {
            const newCategoryData = { ...prevInputs[category], [field]: value };

            if (category === 'tufe' && ['month1', 'year1', 'month2', 'year2'].includes(field)) {
                if ((field === 'month1' || field === 'year1') && newCategoryData.month1 && newCategoryData.year1) {
                    const key = `${newCategoryData.year1}-${String(newCategoryData.month1).padStart(2, '0')}`;
                    newCategoryData.value1 = TUIK_MOCK_DATA[key]?.toString() || '';
                } else if ((field === 'month2' || field === 'year2') && newCategoryData.month2 && newCategoryData.year2) {
                    const key = `${newCategoryData.year2}-${String(newCategoryData.month2).padStart(2, '0')}`;
                    newCategoryData.value2 = TUIK_MOCK_DATA[key]?.toString() || '';
                }
            } else if (category === 'wage' && ['month1', 'year1', 'month2', 'year2'].includes(field)) {
                if ((field === 'month1' || field === 'year1') && newCategoryData.month1 && newCategoryData.year1) {
                    const year = newCategoryData.year1;
                    newCategoryData.value1 = ASGARI_UCRET_MOCK_DATA[year]?.toString() || '';
                }
                if ((field === 'month2' || field === 'year2') && newCategoryData.month2 && newCategoryData.year2) {
                    const year = newCategoryData.year2;
                    newCategoryData.value2 = ASGARI_UCRET_MOCK_DATA[year]?.toString() || '';
                }
            }

            return { ...prevInputs, [category]: newCategoryData };
        });
    };

    const calculateChange = (data: CalculationData, weight: number): CalculationResult => {
        const value1 = parseFloat(data.value1);
        const value2 = parseFloat(data.value2);

        if (isNaN(value1) || isNaN(value2) || !data.month1 || !data.year1 || !data.month2 || !data.year2) {
            return { change: 0, weightedChange: 0, isValid: false, error: 'Lütfen tüm alanları geçerli şekilde doldurunuz.' };
        }

        const date1 = new Date(parseInt(data.year1), parseInt(data.month1) - 1);
        const date2 = new Date(parseInt(data.year2), parseInt(data.month2) - 1);

        if (date2 < date1) {
            return { change: 0, weightedChange: 0, isValid: false, error: 'İkinci dönem, ilk dönemden daha ileri bir tarih olmalıdır.' };
        }

        if (value1 <= 0) {
            return { change: 0, weightedChange: 0, isValid: false, error: "İlk değer 0'dan büyük olmalıdır." };
        }

        const change = ((value2 - value1) / value1) * 100;
        const weightedChange = change * weight;

        return { change, weightedChange, isValid: true };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setResults({
            fuel: calculateChange(inputs.fuel, WEIGHTS.fuel),
            tufe: calculateChange(inputs.tufe, WEIGHTS.tufe),
            wage: calculateChange(inputs.wage, WEIGHTS.wage),
        });
    };

    const handleReset = () => {
        setInputs({
            fuel: { ...INITIAL_DATA_STATE },
            tufe: { ...INITIAL_DATA_STATE },
            wage: { ...INITIAL_DATA_STATE },
        });
        setResults({});
    };

    const totalWeightedChange = Object.values(results)
        .filter(result => result?.isValid)
        .reduce((sum, result) => sum + (result?.weightedChange || 0), 0);

    const newTicketPrice = useMemo(() => {
        if (totalWeightedChange > -100) { // Prevent negative prices
            return baseTicketPrice * (1 + totalWeightedChange / 100);
        }
        return 0;
    }, [baseTicketPrice, totalWeightedChange]);

    const hasAnyResult = Object.keys(results).length > 0;
    const hasValidResults = Object.values(results).some(result => result?.isValid);

    const getStatusIconTotal = (change: number) => {
        if (change > 0) return <TrendingUp className="w-8 h-8 text-red-500" />;
        if (change < 0) return <TrendingDown className="w-8 h-8 text-green-500" />;
        return <Minus className="w-8 h-8 text-gray-500" />;
    };

    const getStatusColor = (change: number) => {
        if (change > 0) return 'border-red-200 bg-red-50';
        if (change < 0) return 'border-green-200 bg-green-50';
        return 'border-gray-200 bg-gray-50';
    };

    if (!isAuthenticated) {
        return <LoginComponent onLogin={handleLogin} error={loginError} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <img src={logo} alt="Kütahya Belediyesi logosu" className="w-16 h-16 mx-auto mb-2 object-contain" />
                    <div className="flex items-center justify-center mb-4">
                        <Calculator className="w-12 h-12 text-indigo-600 mr-3" />
                        <h1 className="text-4xl font-bold text-gray-800">Ulaşım Hizmetleri Müdürlüğü Eşel Mobil Sistemi</h1>
                    </div>
                    <p className="text-gray-600 text-lg">Yakıt, TÜFE ve Asgari Ücret değişimlerini hesaplayın</p>
                    <p className="text-xs text-gray-500 mt-2 max-w-2xl mx-auto">
                        En son hesaplama tarihi: 25.08.2025, Dikkate Alınan Yakıt Tutarı: 52,5TL, Meclis Tarihi: 3.09.2025 tarih ve 247 sayılı meclis kararı; Zamlı tarife uygulama tarihi: 12.09.2025
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <InputSection
                        title="Yakıt Fiyatı"
                        data={inputs.fuel}
                        onDataChange={(field, value) => handleInputChange('fuel', field, value)}
                        color="orange"
                        infoLink={{ url: "https://www.tppd.com.tr", text: "https://www.tppd.com.tr" }}
                        years={years}
                    />
                    <InputSection
                        title="TÜFE"
                        data={inputs.tufe}
                        onDataChange={(field, value) => handleInputChange('tufe', field, value)}
                        color="blue"
                        years={years}
                    />
                    <InputSection
                        title="Asgari Ücret"
                        data={inputs.wage}
                        onDataChange={(field, value) => handleInputChange('wage', field, value)}
                        color="green"
                        years={years}
                    />

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Hesapla
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Temizle
                        </button>
                    </div>
                </form>

                {hasAnyResult && (
                    <div id="printable-results" className="mt-12 space-y-6">
                        {results.fuel && (
                            <ResultCard
                                title="Yakıt Fiyatı"
                                data={inputs.fuel}
                                result={results.fuel}
                                valueType="fiyat"
                                weightedLabel="Ağırlıklı Yakıt Artış Oranı"
                                color="orange"
                            />
                        )}
                        
                        {results.tufe && (
                            <ResultCard
                                title="TÜFE Değeri"
                                data={inputs.tufe}
                                result={results.tufe}
                                valueType="değer"
                                weightedLabel="Ağırlıklı TÜFE Artış Oranı"
                                color="blue"
                            />
                        )}
                        
                        {results.wage && (
                            <ResultCard
                                title="Asgari Ücret"
                                data={inputs.wage}
                                result={results.wage}
                                valueType="ücret"
                                weightedLabel="Ağırlıklı Asgari Ücret Artış Oranı"
                                color="green"
                            />
                        )}

                        {hasValidResults && (
                            <div className={`bg-white rounded-xl shadow-lg p-8 border-2 ${getStatusColor(totalWeightedChange)} transition-all duration-300`}>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-4">
                                        {getStatusIconTotal(totalWeightedChange)}
                                        <h2 className="text-3xl font-bold text-gray-800 ml-3">Toplam Ağırlıklı Değişim</h2>
                                    </div>
                                    <div className="text-6xl font-bold text-gray-900 mb-2">
                                        %{Math.abs(totalWeightedChange).toFixed(2)}
                                    </div>
                                    <div className="text-lg text-gray-600">
                                        {totalWeightedChange > 0 ? 'Artış' : totalWeightedChange < 0 ? 'Düşüş' : 'Değişim Yok'}
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-gray-300/80 text-center space-y-2">
                                    <div className="text-lg text-gray-800 flex justify-center items-center">
                                        <span className="w-48 text-right mr-4">Mevcut Tam Bilet Ücreti:</span>
                                        <span className="w-32 text-left font-bold">
                                            {baseTicketPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-semibold text-gray-900 flex justify-center items-center">
                                        <span className="w-48 text-right mr-4">Yeni Tam Bilet Ücreti:</span>
                                        <span className="w-32 text-left font-bold text-indigo-600">
                                            {newTicketPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                        </span>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* PDF Print Button */}
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                PDF olarak yazdır
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

