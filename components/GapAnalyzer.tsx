import React from 'react';
import { CalculationParams, PortfolioStats } from '../types';
import { calculateGapAnalysis, formatCurrency } from '../utils/calculations';
import { Target, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface GapAnalyzerProps {
  params: CalculationParams;
  realStats: PortfolioStats;
  simulatedStats: PortfolioStats;
}

export const GapAnalyzer: React.FC<GapAnalyzerProps> = ({ params, realStats, simulatedStats }) => {
  const yearsToRetirement = Math.max(0, params.retirementAge - params.currentAge);
  
  // Do not show if not in comparison mode (i.e., simulated assets are same as real or empty)
  // Simple check: check if IDs are different or just always show if simulatedAssets exist
  if (!params.simulatedAssets || params.simulatedAssets.length === 0) return null;

  const result = calculateGapAnalysis(realStats, simulatedStats, yearsToRetirement);
  
  const isGapPositive = result.shortfall > 0; // Shortfall > 0 means Simulated > Real (We are behind)
  
  if (result.shortfall <= 0 && result.shortfall > -1000) {
      // Almost equal or Real is better
      return null;
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          目標差距分析
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isGapPositive ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
            {isGapPositive ? '落後目標' : '超越目標'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Comparison Details */}
        <div className="space-y-4">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm text-slate-500">真實組合預估 (退休時)</span>
                    <span className="font-mono font-bold text-xs sm:text-base text-slate-700">
                        {formatCurrency(realStats.totalValue * Math.pow(1 + (realStats.weightedReturn + realStats.weightedYield)/100, yearsToRetirement))}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-indigo-500">理想組合預估 (退休時)</span>
                    <span className="font-mono font-bold text-xs sm:text-base text-indigo-600">
                         {formatCurrency(simulatedStats.totalValue * Math.pow(1 + (simulatedStats.weightedReturn + simulatedStats.weightedYield)/100, yearsToRetirement))}
                    </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">預估缺口</span>
                    <span className={`font-bold ${isGapPositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isGapPositive ? '-' : '+'}{formatCurrency(Math.abs(result.shortfall))}
                    </span>
                </div>
             </div>
        </div>

        {/* Suggestion */}
        <div className={`p-4 rounded-xl border flex flex-col justify-center ${
            isGapPositive ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'
        }`}>
            {isGapPositive ? (
                <>
                    <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500">
                             <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">保守修復建議</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                為了彌補這個缺口，建議現在加入保守型資產 (如高評級債券，預估殖利率 {result.conservativeYield}%)。
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 pl-[52px]">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">建議投入金額</p>
                        <p className="text-lg sm:text-xl font-bold text-indigo-600 flex flex-wrap items-center gap-2">
                            {formatCurrency(result.suggestedConservativeAmount)}
                            <span className="flex items-center gap-1">
                                <ArrowRight className="w-4 h-4 text-indigo-300" />
                                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                            </span>
                        </p>
                    </div>
                </>
            ) : (
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500">
                         <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-800 text-sm">表現優異</h4>
                        <p className="text-xs text-emerald-600/80 leading-relaxed mt-1">
                            您目前的真實投資組合表現優於模擬的理想情境，請繼續保持！
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};