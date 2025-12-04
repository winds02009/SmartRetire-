import React from 'react';
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
import { SimulationResult } from '../types';
import { formatCurrency } from '../utils/calculations';

interface MonteCarloChartProps {
  data: SimulationResult[];
}

export const MonteCarloChart: React.FC<MonteCarloChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-6">
      <div className="mb-4">
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          蒙地卡羅退休模擬 (500次運算)
        </h3>
        <p className="text-sm text-slate-500">
          考量市場波動風險後，預測您的資產範圍。即使市場表現不佳(悲觀情境)，您的資產仍可能落在下方區間。
        </p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorP10" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="age" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              label={{ value: '年齡', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              tick={{ fill: '#64748b', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(label) => `${label} 歲`}
              contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="p90"
              name="樂觀情境 (前10%表現)"
              stroke="#10b981"
              fill="url(#colorP90)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="p50"
              name="中位數 (正常表現)"
              stroke="#3b82f6"
              fill="url(#colorP50)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="p10"
              name="悲觀情境 (後10%表現)"
              stroke="#f43f5e"
              fill="url(#colorP10)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};