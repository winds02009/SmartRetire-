
import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { YearlyResult } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Eye, EyeOff } from 'lucide-react';

interface ResultsChartProps {
  data: YearlyResult[];
  simulatedData?: YearlyResult[];
  showComparison?: boolean;
}

const CustomTooltip = ({ active, payload, label, showReal }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isReal = showReal;
    
    // Get correct values based on mode
    const netWorth = isReal ? data.netWorthReal : data.netWorth;
    const totalLiabilities = isReal ? data.totalLiabilitiesReal : data.totalLiabilities;
    const totalAppreciation = isReal ? data.totalAppreciationReal : data.totalAppreciation;
    const totalDividends = isReal ? data.totalDividendsReal : data.totalDividends;
    const totalPrincipal = isReal ? data.totalPrincipalReal : data.totalPrincipal;
    const totalBalance = isReal ? data.totalBalanceReal : data.totalBalance;
    const simBalance = isReal ? data.simulatedTotalBalanceReal : data.simulatedTotalBalance;

    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100 ring-1 ring-slate-900/5 text-xs min-w-[200px] z-50">
        <p className="font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex justify-between items-center">
          <span>{label} 歲</span>
          <span className="text-[10px] font-normal text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
            {isReal ? '實質購買力 (Real)' : '名目金額 (Nominal)'}
          </span>
        </p>
        
        {/* Total Balance Highlight */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">預估淨資產 (Net Worth)</p>
          <div className="flex items-baseline gap-1">
             <p className="text-xl font-bold text-emerald-600 font-mono tracking-tight">
                {formatCurrency(netWorth)}
             </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
           {totalLiabilities > 0 && (
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-slate-600">剩餘房貸/負債</span>
                </div>
                <span className="font-mono font-medium text-rose-500">-{formatCurrency(totalLiabilities)}</span>
            </div>
           )}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
               <span className="text-slate-600">資本利得</span>
             </div>
             <span className="font-mono font-medium text-violet-600">+{formatCurrency(totalAppreciation)}</span>
          </div>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]"></span>
               <span className="text-slate-600">累積股息</span>
             </div>
             <span className="font-mono font-medium text-sky-600">+{formatCurrency(totalDividends)}</span>
          </div>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-slate-400"></span>
               <span className="text-slate-600">投入本金</span>
             </div>
             <span className="font-mono font-medium text-slate-500">{formatCurrency(totalPrincipal)}</span>
          </div>
        </div>
        
        {/* Comparison if exists */}
        {simBalance !== undefined && (
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
            <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full border border-indigo-500"></span>
                    理想模擬值
                </span>
                <span className="font-bold text-indigo-500 font-mono">
                {formatCurrency(simBalance)}
                </span>
            </div>
            {totalBalance < simBalance && (
                 <p className="text-[10px] text-right text-rose-400 mt-1">
                    落後 {formatCurrency(simBalance - totalBalance)}
                 </p>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ResultsChart: React.FC<ResultsChartProps> = ({ data, simulatedData, showComparison }) => {
  const [showReal, setShowReal] = useState(false);

  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">無數據</div>;

  const chartData = useMemo(() => {
    if (!showComparison || !simulatedData) return data;
    return data.map((item) => {
      const simItem = simulatedData.find((s) => s.age === item.age);
      return {
        ...item,
        simulatedTotalBalance: simItem ? simItem.totalBalance : undefined,
        simulatedTotalBalanceReal: simItem ? simItem.totalBalanceReal : undefined,
      };
    });
  }, [data, simulatedData, showComparison]);

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10">
        <button
          onClick={() => setShowReal(!showReal)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showReal 
            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' 
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title={showReal ? "切換回帳面金額 (Nominal)" : "切換至實質購買力 (Real) - 扣除通膨"}
        >
          {showReal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showReal ? '顯示: 實質購買力' : '顯示: 帳面金額'}
        </button>
      </div>

      <div className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 30,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorAppreciation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDividends" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLiabilities" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="age" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              label={{ value: '年齡', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              tick={{ fill: '#64748b', fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              content={<CustomTooltip showReal={showReal} />}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }} 
              iconType="circle"
            />
            
            <Area
              type="monotone"
              dataKey={showReal ? "totalLiabilitiesReal" : "totalLiabilities"}
              name="負債餘額 (房貸)"
              stroke="#f43f5e"
              fill="url(#colorLiabilities)"
              strokeWidth={2}
              strokeDasharray="5 5"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#f43f5e' }}
            />

            <Area
              type="monotone"
              dataKey={showReal ? "totalAppreciationReal" : "totalAppreciation"}
              name="資本利得"
              stackId="1"
              stroke="#8b5cf6"
              fill="url(#colorAppreciation)"
              strokeWidth={0}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'white', fill: '#8b5cf6' }}
            />
            <Area
              type="monotone"
              dataKey={showReal ? "totalDividendsReal" : "totalDividends"}
              name="累積股息"
              stackId="1"
              stroke="#0ea5e9"
              fill="url(#colorDividends)"
              strokeWidth={0}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'white', fill: '#0ea5e9' }}
            />
            <Area
              type="monotone"
              dataKey={showReal ? "totalPrincipalReal" : "totalPrincipal"}
              name="投入本金"
              stackId="1"
              stroke="#94a3b8"
              fill="url(#colorPrincipal)"
              strokeWidth={0}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'white', fill: '#94a3b8' }}
            />
            
            {showComparison && (
              <Area
                type="monotone"
                dataKey={showReal ? "simulatedTotalBalanceReal" : "simulatedTotalBalance"}
                name="模擬路徑"
                stroke="#6366f1"
                fill="none"
                strokeDasharray="5 5"
                strokeWidth={2}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#6366f1' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
