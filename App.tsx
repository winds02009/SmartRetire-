
import React, { useState, useMemo, useEffect } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsChart } from './components/ResultsChart';
import { AIAdvisor } from './components/AIAdvisor';
import { PortfolioManager } from './components/PortfolioManager';
import { AllocationChart } from './components/AllocationChart';
import { MonteCarloChart } from './components/MonteCarloChart';
import { StressTestModal } from './components/StressTestModal';
import { HKBenchmark } from './components/HKBenchmark';
import { TotalAssetCard } from './components/TotalAssetCard';
import { GapAnalyzer } from './components/GapAnalyzer';
import { ResultsDashboard } from './components/ResultsDashboard';
import { calculateCompoundInterest, formatCurrency, calculatePortfolioStats, runMonteCarloSimulation } from './utils/calculations';
import { CalculationParams, Asset } from './types';
import { Calculator, Wallet2, Siren, TrendingUp, Save, RotateCcw, LayoutDashboard, Telescope, Clock } from 'lucide-react';

const STORAGE_KEY = 'smartRetire_params_v8'; // Bump version for inflation support

const DEFAULT_ASSETS: Asset[] = [
  { id: '1', name: '美國科技 ETF', symbol: 'QQQ', type: 'Stock', region: 'US', currency: 'USD', allocation: 0, quantity: 270, expectedReturn: 8, dividendYield: 1, volatility: 20, currentPrice: 154.30, weeklyChange: 1.2 },
  { id: '2', name: '全球高股息', symbol: 'VYM', type: 'Stock', region: 'Global', currency: 'USD', allocation: 0, quantity: 340, expectedReturn: 3, dividendYield: 5, volatility: 12, currentPrice: 89.50, weeklyChange: -0.5 },
  { id: '3', name: '投資級債券', symbol: 'BND', type: 'Bond', region: 'US', currency: 'USD', allocation: 0, quantity: 200, expectedReturn: 2, dividendYield: 4, volatility: 5, currentPrice: 98.10, weeklyChange: 0.1 },
  { id: '4', name: '匯豐控股', symbol: '0005.HK', type: 'Stock', region: 'Asia', currency: 'HKD', allocation: 0, quantity: 4000, expectedReturn: 4, dividendYield: 7, volatility: 18, currentPrice: 62.5, weeklyChange: 0.8 },
  { id: '5', name: '現金定存 (HKD)', symbol: 'HKD', type: 'Cash', region: 'Asia', currency: 'HKD', allocation: 0, quantity: 150000, expectedReturn: 1.5, dividendYield: 0, volatility: 0, currentPrice: 1.0, weeklyChange: 0 }
];

// Initialize simulated assets to be same as default for a starting point
const DEFAULT_SIMULATED_ASSETS: Asset[] = [
  ...DEFAULT_ASSETS.map(a => ({...a, id: `sim-${a.id}`, expectedReturn: a.expectedReturn + 2})) 
];

const DEFAULT_PARAMS: CalculationParams = {
  currentAge: 30,
  retirementAge: 65,
  monthlyIncome: 35000, 
  targetMonthlyIncome: 30000, 
  targetAnnualYield: 5.0,     
  initialPrincipal: 104675, 
  monthlyContribution: 5000,
  annualExtraContribution: 20000,
  inflationRate: 2.5, // Default annual inflation
  useManualReturn: false,
  manualReturnRate: 6,
  manualDividendYield: 3,
  assets: DEFAULT_ASSETS,
  simulatedAssets: DEFAULT_SIMULATED_ASSETS,
  lastPortfolioUpdate: Date.now(),
  // Default Mortgage
  mortgage: {
    hasMortgage: false,
    remainingPrincipal: 4000000,
    annualRate: 3.5,
    remainingYears: 20,
    monthlyPayment: 23199, 
    reinvestAfterPayoff: true
  }
};

export default function App() {
  // Initialize state from localStorage if available
  const [params, setParams] = useState<CalculationParams>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Migration logic
          if (parsed.inflationRate === undefined) parsed.inflationRate = 2.5;
          if (parsed.targetMonthlyIncome === undefined) parsed.targetMonthlyIncome = 30000;
          if (parsed.targetAnnualYield === undefined) parsed.targetAnnualYield = 5.0;
          if (parsed.mortgage === undefined) parsed.mortgage = DEFAULT_PARAMS.mortgage;
          
          return parsed;
        }
      } catch (error) {
        console.warn('Failed to parse saved data:', error);
      }
    }
    return DEFAULT_PARAMS;
  });
  
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);
  const [activePortfolioTab, setActivePortfolioTab] = useState<'real' | 'simulated'>('real');
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'projections' | 'risk'>('overview');

  // Save to localStorage whenever params change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  }, [params]);

  // Calculate stats for both portfolios
  const realPortfolioStats = useMemo(() => calculatePortfolioStats(params.assets), [params.assets]);
  const simulatedPortfolioStats = useMemo(() => calculatePortfolioStats(params.simulatedAssets), [params.simulatedAssets]);

  // Handler for Asset updates
  const handleSetRealAssets = (newAssets: Asset[]) => {
    setParams(prev => ({ 
      ...prev, 
      assets: newAssets,
      // REMOVED: initialPrincipal linkage. 
      // User can now set initialPrincipal independently from the actual portfolio value.
      lastPortfolioUpdate: Date.now()
    }));
  };

  const handleSetSimulatedAssets = (newAssets: Asset[]) => {
    setParams(prev => ({ 
      ...prev, 
      simulatedAssets: newAssets,
      lastPortfolioUpdate: Date.now()
    }));
  };
  
  const handleResetData = () => {
    if (confirm('確定要清除所有資料並重置為預設值嗎？')) {
      setParams(DEFAULT_PARAMS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Calculate projections for both
  const results = useMemo(() => calculateCompoundInterest(params), [params]);
  
  // Create a params object specifically for the simulation projection
  const simParams = useMemo(() => ({
    ...params,
    assets: params.simulatedAssets,
    initialPrincipal: simulatedPortfolioStats.totalValue, // Use simulated starting value for comparison chart
    useManualReturn: false // Force use of asset stats
  }), [params, simulatedPortfolioStats]);

  const simulatedResults = useMemo(() => calculateCompoundInterest(simParams), [simParams]);

  const simulationMonteCarlo = useMemo(() => runMonteCarloSimulation(params), [params]);
  
  const finalResult = results.length > 0 ? results[results.length - 1] : undefined;
  
  const milestones = [40, 50, 60, params.retirementAge].filter(age => age > params.currentAge);
  const milestoneData = milestones.map(age => {
    const res = results.find(r => r.age === age);
    return res ? { age, income: res.yearlyPassiveIncome, balance: res.totalBalance } : null;
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900 print:bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 sm:p-2.5 rounded-xl text-white shadow-brand-200 shadow-md">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight leading-none">
                SmartRetire Pro
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">全方位資產配置退休模擬</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             {/* Hide Last Sync on Mobile */}
             <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full font-medium">
                <Clock className="w-3.5 h-3.5" />
                上次同步: {params.lastPortfolioUpdate ? new Date(params.lastPortfolioUpdate).toLocaleTimeString() : '尚未同步'}
             </div>
             {/* Simplified Mobile Save Indicator */}
             <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium">
                <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">系統已自動保存</span>
                <span className="sm:hidden">已存</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 print:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Input & Portfolio */}
          <div className="lg:col-span-5 space-y-6">
            <TotalAssetCard 
              stats={realPortfolioStats} 
              targetMonthlyIncome={params.targetMonthlyIncome} 
              targetAnnualYield={params.targetAnnualYield} 
              mortgage={params.mortgage}
              netWorth={results[0]?.netWorth}
            />
            
            {/* Portfolio Switcher */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex shadow-sm">
              <button
                onClick={() => setActivePortfolioTab('real')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                  activePortfolioTab === 'real' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                真實資產
              </button>
              <button
                onClick={() => setActivePortfolioTab('simulated')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                  activePortfolioTab === 'simulated' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Telescope className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                模擬理想
              </button>
            </div>

            {activePortfolioTab === 'real' ? (
              <>
                <PortfolioManager 
                  key="real" // Add key to force remount on tab switch
                  assets={params.assets} 
                  setAssets={handleSetRealAssets} 
                  title="真實資產配置"
                />
                <AllocationChart assets={params.assets} />
              </>
            ) : (
              <>
                <PortfolioManager 
                  key="simulated" // Add key to force remount on tab switch
                  assets={params.simulatedAssets} 
                  setAssets={handleSetSimulatedAssets} 
                  title="模擬理想配置"
                  isSimulationMode={true}
                />
                <AllocationChart assets={params.simulatedAssets} />
              </>
            )}

            <CalculatorForm 
              params={params} 
              setParams={setParams} 
              portfolioStats={realPortfolioStats} 
            />
            
            <div className="text-center pt-2">
               <button 
                 onClick={handleResetData}
                 className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto transition-colors p-2"
               >
                 <RotateCcw className="w-3 h-3" /> 重置所有資料
               </button>
            </div>
          </div>

          {/* Right Column: Analysis & Results */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tab Navigation */}
            <div className="flex p-1 bg-slate-200/50 rounded-xl overflow-hidden">
               <button
                 onClick={() => setActiveResultTab('overview')}
                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                   activeResultTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                 }`}
               >
                 📊 總覽分析
               </button>
               <button
                 onClick={() => setActiveResultTab('projections')}
                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                   activeResultTab === 'projections' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                 }`}
               >
                 📈 成長趨勢
               </button>
               <button
                 onClick={() => setActiveResultTab('risk')}
                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                   activeResultTab === 'risk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                 }`}
               >
                 🛡️ 風險與建議
               </button>
            </div>

            {/* Tab Content */}
            {activeResultTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ResultsDashboard 
                  finalResult={finalResult} 
                  targetMonthlyIncome={params.targetMonthlyIncome} 
                  portfolioStats={activePortfolioTab === 'real' ? realPortfolioStats : simulatedPortfolioStats}
                  activePortfolioTab={activePortfolioTab}
                  params={params}
                />

                {/* Gap Analyzer (New) */}
                <GapAnalyzer 
                  params={params}
                  realStats={realPortfolioStats}
                  simulatedStats={simulatedPortfolioStats}
                />

                {/* Dividend Milestones */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white">
                    <Wallet2 className="w-5 h-5 text-brand-600" />
                    <h3 className="font-bold text-slate-800">現金流里程碑預估</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                    {milestoneData.map((m, idx) => (
                      <div key={idx} className="p-4 text-center hover:bg-slate-50 transition-colors">
                        <p className="text-sm text-slate-500 mb-1">{m?.age} 歲時</p>
                        <p className="text-xs text-slate-400 mb-2">預估資產: {m ? formatCurrency(m.balance) : '-'}</p>
                        <p className="text-brand-600 font-bold text-lg">
                          {m ? formatCurrency(m.income) : '-'}
                          <span className="text-xs font-normal text-slate-400">/年</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeResultTab === 'projections' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Main Growth Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-brand-600" />
                      資產成長趨勢比較
                    </h3>
                    <div className="flex gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1 text-slate-600">
                        <span className="w-3 h-1 bg-brand-500 rounded-full"></span> 真實路徑
                      </div>
                      <div className="flex items-center gap-1 text-indigo-500">
                        <span className="w-3 h-1 border-t-2 border-indigo-400 border-dashed"></span> 模擬路徑
                      </div>
                    </div>
                  </div>
                  <ResultsChart 
                    data={results} 
                    simulatedData={simulatedResults} 
                    showComparison={true}
                  />
                </div>

                {/* Monte Carlo Simulation */}
                <MonteCarloChart data={simulationMonteCarlo} />
              </div>
            )}

            {activeResultTab === 'risk' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AIAdvisor 
                    params={params} 
                    finalResult={finalResult} 
                    portfolioStats={realPortfolioStats}
                    simulationResults={simulationMonteCarlo}
                  />
                  
                  <HKBenchmark params={params} />
                  
                  {/* Stress Test Trigger */}
                  <button 
                    onClick={() => setIsStressTestOpen(true)}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-2xl shadow-lg shadow-rose-200 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 sm:gap-3 font-bold text-base sm:text-lg group"
                  >
                    <Siren className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                    人生壓力測試：模擬 9 種極端情境
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs sm:text-sm group-hover:bg-white/30 transition-colors hidden sm:inline">立即檢測</span>
                  </button>
               </div>
            )}
          </div>
        </div>
      </main>

      <StressTestModal 
        isOpen={isStressTestOpen} 
        onClose={() => setIsStressTestOpen(false)} 
        params={params} 
      />
    </div>
  );
}
