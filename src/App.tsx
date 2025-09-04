import React, { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

const MONTH_NAMES = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const TUIK_MOCK_DATA: { [key: string]: number } = {
  '2024-01': 1984.02, '2024-02': 2073.88, '2024-03': 2139.47, '2024-04': 2207.50,
  '2024-05': 2281.85, '2024-06': 2319.29,'2024-07': 2394.10, '2024-08': 2453.34, '2024-09': 2526.16, '2024-10': 2598.91, '2024-11': 2657.23, '2024-12': 2684.55,
  '2025-01': 2819.65, '2025-02': 2883.75, '2025-03': 2954.69, '2025-04': 3043.23, '2025-05': 3089.74, '2025-06': 3132.17, '2025-07': 3196.66, '2025-08': 3261.72,
};

function App() {
  const [fuelData, setFuelData] = useState<CalculationData>({
    month1: '', year1: '', value1: '', month2: '', year2: '', value2: ''
  });
  const [tufeData, setTufeData] = useState<CalculationData>({
    month1: '', year1: '', value1: '', month2: '', year2: '', value2: ''
  });
  const [wageData, setWageData] = useState<CalculationData>({
    month1: '', year1: '', value1: '', month2: '', year2: '', value2: ''
  });

  const [results, setResults] = useState<{
    fuel: CalculationResult | null;
    tufe: CalculationResult | null;
    wage: CalculationResult | null;
  }>({ fuel: null, tufe: null, wage: null });

  const calculateChange = (data: CalculationData, weight: number): CalculationResult => {
    const value1 = parseFloat(data.value1);
    const value2 = parseFloat(data.value2);

    if (isNaN(value1) || isNaN(value2) || !data.month1 || !data.year1 || !data.month2 || !data.year2) {
      return { change: 0, weightedChange: 0, isValid: false, error: 'Lütfen tüm alanları geçerli şekilde doldurunuz.' };
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
    
    const fuelResult = calculateChange(fuelData, 0.34);
    const tufeResult = calculateChange(tufeData, 0.33);
    const wageResult = calculateChange(wageData, 0.33);

    setResults({ fuel: fuelResult, tufe: tufeResult, wage: wageResult });
  };

  const updateTufeValue = (data: CalculationData, field: 'month1' | 'year1' | 'month2' | 'year2', value: string) => {
    const newData = { ...data, [field]: value };
    
    if (field === 'month1' || field === 'year1') {
      if (newData.month1 && newData.year1) {
        const key = `${newData.year1}-${newData.month1.padStart(2, '0')}`;
        const tuikValue = TUIK_MOCK_DATA[key];
        newData.value1 = tuikValue ? tuikValue.toString() : '';
      }
    } else if (field === 'month2' || field === 'year2') {
      if (newData.month2 && newData.year2) {
        const key = `${newData.year2}-${newData.month2.padStart(2, '0')}`;
        const tuikValue = TUIK_MOCK_DATA[key];
        newData.value2 = tuikValue ? tuikValue.toString() : '';
      }
    }
    
    return newData;
  };

  const getStatusIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-5 h-5 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-5 h-5 text-green-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = (change: number) => {
    if (change > 0) return 'border-red-200 bg-red-50';
    if (change < 0) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getFullName = (month: string, year: string) => {
    const monthName = MONTH_NAMES[parseInt(month)];
    return (monthName && year) ? `${monthName} ${year}` : '';
  };

  const totalWeightedChange = Object.values(results)
    .filter(result => result?.isValid)
    .reduce((sum, result) => sum + (result?.weightedChange || 0), 0);

  const hasValidResults = Object.values(results).some(result => result?.isValid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Ulaşım Hizmetleri Müdürlüğü Eşel Mobil Sistemi</h1>
          </div>
          <p className="text-gray-600 text-lg">Yakıt, TÜFE ve Asgari Ücret değişimlerini hesaplayın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Yakıt Fiyatı */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                      <span>Yakıt Fiyatı</span>
              </h2>
              <p className="text-red-500 italic text-sm font-normal pl-6">
                (
                <a 
                  href="https://www.tppd.com.tr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-red-700"
                >
                  https://www.tppd.com.tr
                </a> adresinden alınacaktır)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">İlk Dönem</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={fuelData.month1} 
                    onChange={(e) => setFuelData({...fuelData, month1: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select 
                    value={fuelData.year1} 
                    onChange={(e) => setFuelData({...fuelData, year1: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Yıl</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={fuelData.value1}
                  onChange={(e) => setFuelData({...fuelData, value1: e.target.value})}
                  placeholder="Yakıt fiyatı (TL)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">İkinci Dönem</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={fuelData.month2} 
                    onChange={(e) => setFuelData({...fuelData, month2: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select 
                    value={fuelData.year2} 
                    onChange={(e) => setFuelData({...fuelData, year2: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Yıl</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={fuelData.value2}
                  onChange={(e) => setFuelData({...fuelData, value2: e.target.value})}
                  placeholder="Yakıt fiyatı (TL)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* TÜFE */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              TÜFE Değeri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">İlk Dönem</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={tufeData.month1} 
                    onChange={(e) => {
                      const newData = updateTufeValue(tufeData, 'month1', e.target.value);
                      setTufeData(newData);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select 
                    value={tufeData.year1} 
                    onChange={(e) => {
                      const newData = updateTufeValue(tufeData, 'year1', e.target.value);
                      setTufeData(newData);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Yıl</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={tufeData.value1}
                  onChange={(e) => setTufeData({...tufeData, value1: e.target.value})}
                  placeholder="TÜFE değeri"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">İkinci Dönem</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={tufeData.month2} 
                    onChange={(e) => {
                      const newData = updateTufeValue(tufeData, 'month2', e.target.value);
                      setTufeData(newData);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select 
                    value={tufeData.year2} 
                    onChange={(e) => {
                      const newData = updateTufeValue(tufeData, 'year2', e.target.value);
                      setTufeData(newData);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Yıl</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={tufeData.value2}
                  onChange={(e) => setTufeData({...tufeData, value2: e.target.value})}
                  placeholder="TÜFE değeri"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Asgari Ücret */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              Asgari Ücret
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">İlk Dönem</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={wageData.month1} 
                    onChange={(e) => setWageData({...wageData, month1: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select 
                    value={wageData.year1} 
                    onChange={(e) => setWageData({...wageData, year1: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Yıl</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={wageData.value1}
                  onChange={(e) => setWageData({...wageData, value1: e.target.value})}
                  placeholder="Asgari ücret (TL)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">İkinci Dönem</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={wageData.month2} 
                    onChange={(e) => setWageData({...wageData, month2: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Ay</option>
                    {MONTH_NAMES.slice(1).map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select 
                    value={wageData.year2} 
                    onChange={(e) => setWageData({...wageData, year2: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Yıl</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={wageData.value2}
                  onChange={(e) => setWageData({...wageData, value2: e.target.value})}
                  placeholder="Asgari ücret (TL)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Hesapla
            </button>
          </div>
        </form>

        {/* Results */}
        {(results.fuel || results.tufe || results.wage) && (
          <div className="mt-8 space-y-6">
            {/* Individual Results */}
            {results.fuel && (
              <ResultCard 
                title="Yakıt Fiyatı"
                data={fuelData}
                result={results.fuel}
                valueType="fiyat"
                weightedLabel="Ağırlıklı Yakıt Artış Oranı"
                color="orange"
              />
            )}
            
            {results.tufe && (
              <ResultCard 
                title="TÜFE Değeri"
                data={tufeData}
                result={results.tufe}
                valueType="değer"
                weightedLabel="Ağırlıklı TÜFE Artış Oranı"
                color="blue"
              />
            )}
            
            {results.wage && (
              <ResultCard 
                title="Asgari Ücret"
                data={wageData}
                result={results.wage}
                valueType="ücret"
                weightedLabel="Ağırlıklı Asgari Ücret Artış Oranı"
                color="green"
              />
            )}

            {/* Total Result */}
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
    if (change > 0) return <TrendingUp className="w-5 h-5 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-5 h-5 text-green-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
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

export default App;
