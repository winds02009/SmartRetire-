import React from 'react';
import { CalculationParams } from '../types';
import { getHKBenchmark, formatCurrency } from '../utils/calculations';
import { Users, TrendingUp, TrendingDown, Medal } from 'lucide-react';

interface HKBenchmarkProps {
  params: CalculationParams;
}

export const HKBenchmark: React.FC<HKBenchmarkProps> = ({ params }) => {
  const benchmark = getHKBenchmark(params.currentAge);
  
  if (!benchmark) return null;

  // Calculate percentages relative to median
  const incomeRatio = params.monthlyIncome / benchmark.medianIncome;
  const assetRatio = params.initialPrincipal / benchmark.medianAssets;

  // Simple "Rank" estimation (This is a rough heuristic for gamification)
  const getRank = (ratio: number) => {
    if (ratio > 2.5) return { label: '前 5% 頂尖', color: 'text-violet-600', bg: 'bg-violet-100', bar: 'bg-violet-500' };
    if (ratio > 1.8) return { label: '前 10% 菁英', color: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500' };
    if (ratio > 1.2) return { label: '高於平均', color: 'text-blue-600', bg: 'bg-blue-100', bar: 'bg-blue-500' };
    if (ratio > 0.8) return { label: '接近平均', color: 'text-slate-600', bg: 'bg-slate-100', bar: 'bg-slate-400' };
    return { label: '低於平均', color: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-500' };
  };

  const incomeRank = getRank(incomeRatio);
  const assetRank = getRank(assetRatio);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-600" />
          香港同齡層財富對比 ({benchmark.ageRange} 歲)
        </h3>
        <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-500 hidden sm:block">
          資料來源: 統計處/財富報告估算
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Income Comparison */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-slate-500 font-medium">月收入水平</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(params.monthlyIncome)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${incomeRank.bg} ${incomeRank.color}`}>
              {incomeRatio >= 1 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {incomeRank.label}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="relative pt-6 pb-2">
            {/* Median Marker */}
            <div className="absolute top-0 left-0 w-full flex items-center text-xs text-slate-400" style={{ left: '30%' }}>
              <div className="h-6 w-px bg-slate-300 absolute bottom-0 left-0"></div>
              <span className="-ml-8 mb-8">中位數 {formatCurrency(benchmark.medianIncome)}</span>
            </div>

            <div className="h-4 bg-slate-100 rounded-full overflow-hidden w-full flex">
              <div className="w-[30%] bg-slate-300 border-r-2 border-white" title="中位數基準"></div>
              {/* User Bar - scaled roughly. If median is 30% of bar, then bar max is median * 3.33 */}
              <div 
                className={`h-full ${incomeRank.bar} rounded-r-full transition-all duration-1000`} 
                style={{ width: `${Math.min(Math.max((params.monthlyIncome / (benchmark.medianIncome * 3.3)) * 100, 0), 70)}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-slate-400 mt-2 text-right">
              {incomeRatio > 1 
                ? `您的收入是同齡中位數的 ${(incomeRatio).toFixed(1)} 倍` 
                : `距離中位數還差 ${formatCurrency(benchmark.medianIncome - params.monthlyIncome)}`}
            </p>
          </div>
        </div>

        {/* Assets Comparison */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-slate-500 font-medium">總資產淨值</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(params.initialPrincipal)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${assetRank.bg} ${assetRank.color}`}>
              {assetRatio >= 1 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {assetRank.label}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="relative pt-6 pb-2">
             {/* Median Marker */}
             <div className="absolute top-0 left-0 w-full flex items-center text-xs text-slate-400" style={{ left: '30%' }}>
              <div className="h-6 w-px bg-slate-300 absolute bottom-0 left-0"></div>
              <span className="-ml-8 mb-8">中位數 {formatCurrency(benchmark.medianAssets)}</span>
            </div>

            <div className="h-4 bg-slate-100 rounded-full overflow-hidden w-full flex">
               <div className="w-[30%] bg-slate-300 border-r-2 border-white" title="中位數基準"></div>
               {/* User Bar */}
               <div 
                className={`h-full ${assetRank.bar} rounded-r-full transition-all duration-1000`} 
                style={{ width: `${Math.min(Math.max((params.initialPrincipal / (benchmark.medianAssets * 3.3)) * 100, 0), 70)}%` }}
              ></div>
            </div>

             <p className="text-xs text-slate-400 mt-2 text-right">
              {assetRatio > 1 
                ? `您的資產是同齡中位數的 ${(assetRatio).toFixed(1)} 倍` 
                : `距離中位數還差 ${formatCurrency(benchmark.medianAssets - params.initialPrincipal)}`}
            </p>
          </div>
        </div>

      </div>

      {params.monthlyIncome === 0 && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center gap-2">
          <Medal className="w-4 h-4" />
          提示：請在左側輸入「目前月收入」，以獲得更完整的對比分析。
        </div>
      )}
    </div>
  );
};