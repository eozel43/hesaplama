import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

// Mock data for CPI (TÜFE). In a real-world app, this would come from an API.
const TUIK_MOCK_DATA: { [key: string]: number } = {
  '2024-01': 1984.02, '2024-02': 2073.88, '2024-03': 2139.47, '2024-04': 2207.50,
  '2024-05': 2281.85, '2024-06': 2319.29, '2024-07': 2394.10, '2024-08': 2453.34, '2024-09': 2526.16, '2024-10': 2598.91, '2024-11': 2657.23, '2024-12': 2684.55,
  '2025-01': 2819.65, '2025-02': 2883.75, '2025-03': 2954.69, '2025-04': 3043.23, '2025-05': 3089.74, '2025-06': 3132.17, '2025-07': 3196.66, '2025-08': 3261.72,
};

// Weights for each calculation category. Centralized for easy updates.
const WEIGHTS = {
  fuel: 0.34,
  tufe: 0.33,
  wage: 0.33,
};

// Initial state for a single calculation category's data.
const INITIAL_DATA_STATE: CalculationData = {
  month1: '', year1: '', value1: '', month2: '', year2: '', value2: ''
};

// --- HELPER FUNCTIONS ---

/**
 * Generates a range of years for dropdowns.
 * @returns {number[]} An array of years.
 */
const generateYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear();
    // Creates an array of 5 years centered around the current year.
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
};


// --- REUSABLE COMPONENTS ---

/**
 * A reusable component for rendering the input fields for a single calculation category.
 */
interface InputSectionProps {
  title: string;
  data: CalculationData;
  onDataChange: (field: keyof CalculationData, value: string) => void;
  color: 'orange' | 'blue' | 'green';
  infoLink?: { url: string; text: string; };
  years: number[];
}

function InputSection({ title, data, onDataChange, color, infoLink, years }: InputSectionProps) {
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


/**
 * A reusable component for displaying the result of a single calculation.
 */
interface ResultCardProps {
  title: string;
  data: CalculationData;
  result: CalculationResult;
  valueType: string;
  weightedLabel: string;
  color: 'orange' | 'blue' | 'green';
}

function ResultCard({ title, data, result, valueType, weightedLabel, color }: ResultCardProps) {
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


// --- MAIN APP COMPONENT ---

function App() {
  const [inputs, setInputs] = useState({
    fuel: { ...INITIAL_DATA_STATE },
    tufe: { ...INITIAL_DATA_STATE },
    wage: { ...INITIAL_DATA_STATE },
  });

  const [results, setResults] = useState<{ [key in CalculationCategory]?: CalculationResult }>({});

  const years = useMemo(() => generateYearOptions(), []);

  const handleInputChange = (
    category: CalculationCategory,
    field: keyof CalculationData,
    value: string
  ) => {
    setInputs(prevInputs => {
      const newCategoryData = { ...prevInputs[category], [field]: value };
      
      // Auto-populate TÜFE value if the category is 'tufe' and a date field was changed
      if (category === 'tufe' && ['month1', 'year1', 'month2', 'year2'].includes(field)) {
          if ((field === 'month1' || field === 'year1') && newCategoryData.month1 && newCategoryData.year1) {
              const key = `${newCategoryData.year1}-${newCategoryData.month1.padStart(2, '0')}`;
              newCategoryData.value1 = TUIK_MOCK_DATA[key]?.toString() || '';
          } else if ((field === 'month2' || field === 'year2') && newCategoryData.month2 && newCategoryData.year2) {
              const key = `${newCategoryData.year2}-${newCategoryData.month2.padStart(2, '0')}`;
              newCategoryData.value2 = TUIK_MOCK_DATA[key]?.toString() || '';
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
  
  const hasAnyResult = Object.keys(results).length > 0;
  const hasValidResults = Object.values(results).some(result => result?.isValid);
  
  const getStatusIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-8 h-8 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-8 h-8 text-green-500" />;
    return <Minus className="w-8 h-8 text-gray-500" />;
  };

  const getStatusColor = (change: number) => {
    if (change > 0) return 'border-red-200 bg-red-50';
    if (change < 0) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Ulaşım Hizmetleri Müdürlüğü Eşel Mobil Sistemi</h1>
          </div>
          <p className="text-gray-600 text-lg">Yakıt, TÜFE ve Asgari Ücret değişimlerini hesaplayın</p>
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
          <div className="mt-12 space-y-6">
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
                    {getStatusIcon(totalWeightedChange)}
                    <h2 className="text-3xl font-bold text-gray-800 ml-3">Toplam Ağırlıklı Değişim</h2>
                  </div>
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    %{Math.abs(totalWeightedChange).toFixed(2)}
                  </div>
                  <div className="text-lg text-gray-600">
                    {totalWeightedChange > 0 ? 'Artış' : totalWeightedChange < 0 ? 'Düşüş' : 'Değişim Yok'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
