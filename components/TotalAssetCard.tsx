
import React from 'react';
import { PortfolioStats } from '../types';
import { formatCurrency, calculateRequiredCapital } from '../utils/calculations';
import { TrendingUp, Activity, Wallet, Target, Scale } from 'lucide-react';

interface TotalAssetCardProps {
  stats: PortfolioStats;
  targetMonthlyIncome?: number;
  targetAnnualYield?: number;
  mortgage?: { remainingPrincipal: number; hasMortgage: boolean }; // Add mortgage prop (optional for now, but used if passed)
  netWorth?: number;
}

export const TotalAssetCard: React.FC<TotalAssetCardProps> = ({ 
  stats, 
  targetMonthlyIncome = 0, 
  targetAnnualYield = 0,
  mortgage,
  netWorth
}) => {
  const totalReturn = stats.weightedReturn + stats.weightedYield;
  
  // Calculate estimated annual passive income based on current asset value
  const annualPassiveIncome = stats.totalValue * (stats.weightedYield / 100);
  const monthlyPassiveIncome = annualPassiveIncome / 12;

  // Calculate Required Capital (FIRE Number)
  const calculationYield = targetAnnualYield > 0 ? targetAnnualYield : stats.weightedYield;
  const requiredCapital = calculateRequiredCapital(targetMonthlyIncome, calculationYield);
  
  const progressPercent = targetMonthlyIncome > 0 ? Math.min((monthlyPassiveIncome / targetMonthlyIncome) * 100, 100) : 0;

  const liabilityAmount = mortgage?.hasMortgage ? mortgage.remainingPrincipal : 0;
  const currentNetWorth = netWorth !== undefined ? netWorth : (stats.totalValue - liabilityAmount);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-xl shadow-slate-200 mb-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500 rounded-full blur-[80px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4 sm:gap-0">
             <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <Scale className="w-5 h-5" />
                <h2 className="text-sm font-medium uppercase tracking-wider">目前淨資產 (Net Worth)</h2>
                </div>
                
                <div className="flex items-baseline gap-2 flex-wrap">
                {/* Responsive text size for net worth */}
                <span className="text-3xl sm:text-4xl font-bold tracking-tight">
                    {formatCurrency(currentNetWorth)}
                </span>
                <span className="text-sm text-slate-400 font-medium">HKD</span>
                </div>
             </div>
             
             {liabilityAmount > 0 && (
                 <div className="text-left sm:text-right bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none w-full sm:w-auto">
                     <p className="text-xs text-rose-400 uppercase tracking-wider font-medium mb-1">總負債</p>
                     <p className="text-base sm:text-lg font-bold text-rose-300">-{formatCurrency(liabilityAmount)}</p>
                     
                     <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1 mt-2">總資產</p>
                     <p className="text-base sm:text-lg font-bold text-slate-200">{formatCurrency(stats.totalValue)}</p>
                 </div>
             )}
        </div>

        {/* Passive Income Goal Tracker */}
        <div className="mb-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-brand-400/20 rounded-lg">
                    <Wallet className="w-4 h-4 text-brand-300" />
                 </div>
                 <span className="text-xs text-slate-300 font-medium">月被動收入進度</span>
              </div>
              <span className="text-xs font-mono text-brand-200">
                {formatCurrency(monthlyPassiveIncome)} / {formatCurrency(targetMonthlyIncome)}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-brand-400 to-violet-400 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>

            {targetMonthlyIncome > 0 && (
              <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                 <Target className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                 <div>
                   <p className="text-[10px] text-slate-400 leading-tight">
                     若退休後資產配置能提供 <strong>{calculationYield.toFixed(1)}%</strong> 年殖利率，
                     要達成月領 {formatCurrency(targetMonthlyIncome)}，您需要累積：
                   </p>
                   <p className="text-sm font-bold text-white mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0">
                     {formatCurrency(requiredCapital)}
                     <span className="text-[10px] font-normal text-slate-400">
                       (尚缺 {formatCurrency(Math.max(0, requiredCapital - stats.totalValue))})
                     </span>
                   </p>
                 </div>
              </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              預期年化總報酬
            </p>
            <p className={`text-base sm:text-lg font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              組合波動風險
            </p>
            <p className="text-base sm:text-lg font-bold text-amber-400">
              {stats.weightedVolatility.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
