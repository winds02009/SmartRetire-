
import React, { useState } from 'react';
import { YearlyResult, PortfolioStats, CalculationParams } from '../types';
import { formatCurrency } from '../utils/calculations';
import { CheckCircle, AlertTriangle, Info, ArrowRight, PieChart, TrendingUp, Wallet, HelpCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface ResultsDashboardProps {
  finalResult: YearlyResult | undefined;
  targetMonthlyIncome: number;
  portfolioStats: PortfolioStats;
  activePortfolioTab: 'real' | 'simulated';
  params: CalculationParams;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  finalResult, 
  targetMonthlyIncome,
  portfolioStats,
  activePortfolioTab,
  params
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!finalResult) return null;

  const monthlyPassive = finalResult.yearlyPassiveIncome / 12;
  const progress = targetMonthlyIncome > 0 ? (monthlyPassive / targetMonthlyIncome) * 100 : 0;
  
  let healthStatus: 'excellent' | 'good' | 'warning' | 'danger' = 'excellent';
  if (progress < 50) healthStatus = 'danger';
  else if (progress < 80) healthStatus = 'warning';
  else if (progress < 100) healthStatus = 'good';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'good': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'warning': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'danger': return 'text-rose-700 bg-rose-50 border-rose-100';
      default: return 'text-slate-700 bg-slate-50 border-slate-100';
    }
  };

  const statusConfig = {
    excellent: { icon: CheckCircle, text: '完美達標', desc: '您的被動收入將超越目標，享有富足退休生活。' },
    good: { icon: CheckCircle, text: '大致達標', desc: '預估被動收入接近目標，生活無虞。' },
    warning: { icon: AlertTriangle, text: '尚有缺口', desc: '建議增加投入或延後退休以達成目標。' },
    danger: { icon: AlertTriangle, text: '嚴重落後', desc: '退休金可能不足，請盡快調整規劃。' },
  };

  const currentConfig = statusConfig[healthStatus];
  const Icon = currentConfig.icon;

  // Identify source of return rates
  const sourceName = activePortfolioTab === 'real' ? '真實資產配置' : '模擬理想配置';
  const currentAssets = activePortfolioTab === 'real' ? params.assets : params.simulatedAssets;
  const hasAssets = currentAssets && currentAssets.length > 0;
  const isZeroReturnMode = !params.useManualReturn && !hasAssets;

  const usedReturn = params.useManualReturn ? params.manualReturnRate : portfolioStats.weightedReturn;
  const usedYield = params.useManualReturn ? params.manualDividendYield : portfolioStats.weightedYield;

  return (
    <div className="space-y-4">
      {/* 0. Zero Asset Warning */}
      {isZeroReturnMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
           <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
           </div>
           <div>
              <h4 className="text-sm font-bold text-amber-800">偵測到{sourceName}為空</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                 您目前的資產列表沒有任何項目，且未啟用「手動參數設定」。
                 <br/>
                 <span className="font-medium">影響：</span> 系統將以 <strong>0% 回報率</strong> 進行計算，您的資產成長曲線將呈現水平（僅包含投入本金，無複利效果）。
              </p>
              <div className="mt-2 text-xs font-medium text-amber-800 bg-amber-100/50 px-2 py-1.5 rounded inline-block">
                 💡 建議：請在左側新增資產，或在基礎參數中開啟「手動設定」。
              </div>
           </div>
        </div>
      )}

      {/* 1. Calculation Context / Relationship Explanation */}
      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
         <button 
           onClick={() => setShowExplanation(!showExplanation)}
           className="w-full px-4 py-3 bg-indigo-50/50 flex items-center justify-between text-left transition-colors hover:bg-indigo-50"
         >
            <div className="flex items-center gap-2 text-indigo-900">
               <Info className="w-4 h-4 text-indigo-500" />
               <span className="text-sm font-bold">運算基礎：此分析如何產生？</span>
            </div>
            {showExplanation ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
         </button>
         
         {showExplanation && (
           <div className="p-4 bg-white text-sm text-slate-600 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <p className="leading-relaxed">
                下方的退休預測結果，是將您在左側設定的 <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">{sourceName}</strong> 之投資回報率，
                套用至您的 <strong className="text-slate-800 bg-slate-100 px-1 rounded">資金投入計劃</strong> 所計算得出。
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                 <div className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-1 text-slate-500 text-xs font-bold uppercase">
                       <Wallet className="w-3.5 h-3.5" /> 起始資金
                    </div>
                    <div className="font-mono font-bold text-slate-700">{formatCurrency(params.initialPrincipal)}</div>
                 </div>
                 <div className="flex flex-col items-center justify-center text-slate-300">
                    <ArrowRight className="w-5 h-5" />
                 </div>
                 <div className="p-3 border border-indigo-100 rounded-lg bg-indigo-50/50 sm:col-span-1">
                    <div className="flex items-center gap-2 mb-1 text-indigo-500 text-xs font-bold uppercase">
                       <PieChart className="w-3.5 h-3.5" /> {sourceName}參數
                    </div>
                    <div className="text-xs">
                       年增長: <span className="font-bold text-indigo-700">{usedReturn.toFixed(2)}%</span>
                       <span className="mx-1 text-slate-300">|</span>
                       殖利率: <span className="font-bold text-indigo-700">{usedYield.toFixed(2)}%</span>
                    </div>
                    {params.useManualReturn && (
                       <div className="text-[10px] text-amber-600 mt-1 font-medium">(使用手動覆寫設定)</div>
                    )}
                 </div>
              </div>
           </div>
         )}
         
         {!showExplanation && (
            <div className="px-4 py-2 bg-white flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 border-t border-indigo-50">
               <span className="flex items-center gap-1">
                  來源: <strong className="text-indigo-600">{sourceName}</strong>
               </span>
               <span className="hidden sm:inline text-slate-300">|</span>
               <span className="flex items-center gap-1">
                  參數: <TrendingUp className="w-3 h-3 text-slate-400" /> 總報酬 <strong>{(usedReturn + usedYield).toFixed(2)}%</strong>
               </span>
               <span className="flex-1 text-right text-[10px] text-slate-400">
                  (點擊展開詳情)
               </span>
            </div>
         )}
      </div>

      {/* 2. Main Dashboard Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-2">
        {/* Header / Health Status */}
        <div className={`px-6 py-4 border-b flex items-start gap-4 ${getStatusColor(healthStatus)}`}>
          <div className="p-2 rounded-full bg-white/60 shadow-sm shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg flex flex-wrap items-center gap-2 leading-tight">
              退休健康度評估: {currentConfig.text}
              <span className="text-xs font-normal px-2 py-0.5 bg-white/60 rounded-full border border-black/5 whitespace-nowrap">
                  達成率 {progress.toFixed(0)}%
              </span>
            </h3>
            <p className="text-sm opacity-90 mt-1">{currentConfig.desc}</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Metric: Net Worth */}
          <div className="space-y-2">
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                預估退休淨資產 (Net Worth)
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" title="總資產減去屆時剩餘負債" />
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-slate-800 font-mono tracking-tight">
                {formatCurrency(finalResult.netWorth)}
              </p>
              <p className="text-xs text-slate-400">
                * 此為扣除房貸/負債後的資產淨值
              </p>
          </div>

          {/* Secondary Metric: Passive Income */}
          <div className="space-y-2">
              <p className="text-sm text-slate-500 font-medium">預估月被動收入</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className={`text-2xl sm:text-3xl font-bold font-mono ${progress >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {formatCurrency(monthlyPassive)}
                </p>
                <span className="text-xs text-slate-400">/ 目標 {formatCurrency(targetMonthlyIncome)}</span>
              </div>
              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
              </div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="bg-slate-50/50 border-t border-slate-100 p-4 grid grid-cols-3 divide-x divide-slate-200/60">
          <div className="px-2 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">總投入本金</p>
              <p className="font-bold text-slate-700 text-sm sm:text-base">{formatCurrency(finalResult.totalPrincipal)}</p>
          </div>
          <div className="px-2 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">資本利得</p>
              <p className="font-bold text-violet-600 text-sm sm:text-base">+{formatCurrency(finalResult.totalAppreciation)}</p>
          </div>
          <div className="px-2 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">累積股息</p>
              <p className="font-bold text-sky-600 text-sm sm:text-base">+{formatCurrency(finalResult.totalDividends)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
