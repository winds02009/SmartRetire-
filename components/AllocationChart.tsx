import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Asset } from '../types';
import { convertToHKD, formatCurrency } from '../utils/calculations';
import { PieChart as PieChartIcon, Globe, Layers } from 'lucide-react';

interface AllocationChartProps {
  assets: Asset[];
}

const COLORS = [
  '#6366f1', // Indigo 500
  '#ec4899', // Pink 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#3b82f6', // Blue 500
  '#8b5cf6', // Violet 500
  '#f43f5e', // Rose 500
  '#06b6d4', // Cyan 500
  '#64748b', // Slate 500
  '#84cc16', // Lime 500
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#1e293b" className="text-sm font-bold" style={{ fontSize: '14px' }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} dy={8} textAnchor="middle" fill="#64748b" className="text-xs" style={{ fontSize: '12px' }}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 6}
        outerRadius={innerRadius - 2}
        fill={fill}
        opacity={0.5}
      />
    </g>
  );
};

export const AllocationChart: React.FC<AllocationChartProps> = ({ assets }) => {
  const [activeTypeIndex, setActiveTypeIndex] = useState(0);
  const [activeRegionIndex, setActiveRegionIndex] = useState(0);

  const { typeData, regionData, totalValue } = useMemo(() => {
    const typeMap = new Map<string, number>();
    const regionMap = new Map<string, number>();
    let total = 0;

    assets.forEach(asset => {
      const val = convertToHKD(asset.currentPrice * (asset.quantity || 0), asset.currency || 'HKD');
      total += val;
      typeMap.set(asset.type, (typeMap.get(asset.type) || 0) + val);
      regionMap.set(asset.region, (regionMap.get(asset.region) || 0) + val);
    });

    const toChartData = (map: Map<string, number>) => 
      Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort by value desc

    return {
      typeData: toChartData(typeMap),
      regionData: toChartData(regionMap),
      totalValue: total
    };
  }, [assets]);

  const onTypePieEnter = (_: any, index: number) => {
    setActiveTypeIndex(index);
  };

  const onRegionPieEnter = (_: any, index: number) => {
    setActiveRegionIndex(index);
  };

  if (totalValue === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {/* Type Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
             <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">資產類型分佈</h4>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          <div className="w-full sm:w-1/2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeTypeIndex}
                  activeShape={renderActiveShape}
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  onMouseEnter={onTypePieEnter}
                  paddingAngle={2}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full sm:w-1/2 flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {typeData.map((entry, index) => {
               const percentage = (entry.value / totalValue) * 100;
               const isActive = index === activeTypeIndex;
               return (
                <div 
                  key={entry.name} 
                  className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-slate-50' : ''}`}
                  onMouseEnter={() => setActiveTypeIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className={`font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-700">{percentage.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-400 font-mono">{formatCurrency(entry.value)}</div>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      </div>

      {/* Region Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
             <Globe className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">地區市場分佈</h4>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          <div className="w-full sm:w-1/2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeRegionIndex}
                  activeShape={renderActiveShape}
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  onMouseEnter={onRegionPieEnter}
                  paddingAngle={2}
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full sm:w-1/2 flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {regionData.map((entry, index) => {
               const percentage = (entry.value / totalValue) * 100;
               const isActive = index === activeRegionIndex;
               return (
                <div 
                  key={entry.name} 
                  className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-slate-50' : ''}`}
                  onMouseEnter={() => setActiveRegionIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }}
                    ></span>
                    <span className={`font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-700">{percentage.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-400 font-mono">{formatCurrency(entry.value)}</div>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};