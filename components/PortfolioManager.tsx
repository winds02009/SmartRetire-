import React, { useState, useEffect } from 'react';
import { Asset, Currency } from '../types';
import { Plus, Trash2, PieChart, RefreshCw, DollarSign, TrendingUp, TrendingDown, Coins, Briefcase, Calculator, Save, AlertCircle, X, Check, Search, Loader2, CheckCircle2, XCircle, Ban, ExternalLink, Zap, ChevronDown, BarChart3 } from 'lucide-react';
import { formatCurrency, convertToHKD, calculatePortfolioStats } from '../utils/calculations';

interface PortfolioManagerProps {
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  title?: string;
  isSimulationMode?: boolean;
}

type UpdateStatus = 'idle' | 'loading' | 'success' | 'error' | 'skipped';
type SimulationMode = 'random' | 'bull' | 'bear' | 'crash';

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({ 
  assets, 
  setAssets, 
  title = "資產配置與市場明細",
  isSimulationMode = false
}) => {
  // Local state for editing (Staging Area)
  const [localAssets, setLocalAssets] = useState<Asset[]>(assets);
  const [isGlobalUpdating, setIsGlobalUpdating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);
  
  // Track update status for each row
  const [rowStatuses, setRowStatuses] = useState<Record<string, { status: UpdateStatus; message?: string }>>({});

  // Reset local state when props change
  useEffect(() => {
    setLocalAssets(assets);
    setHasUnsavedChanges(false);
    setRowStatuses({});
  }, [assets]);

  const updateLocalAssets = (newAssets: Asset[]) => {
    setLocalAssets(newAssets);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    setAssets(localAssets);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    setLocalAssets(assets);
    setHasUnsavedChanges(false);
    setRowStatuses({});
  };

  const handleAddAsset = () => {
    const newAsset: Asset = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新資產項目',
      symbol: '',
      type: 'Stock',
      region: 'US',
      currency: 'USD',
      allocation: 0,
      quantity: 100,
      expectedReturn: 5,
      dividendYield: 2,
      volatility: 15,
      currentPrice: 100,
      weeklyChange: 0
    };
    updateLocalAssets([...localAssets, newAsset]);
  };

  const handleUpdateAsset = (id: string, field: keyof Asset, value: any) => {
    updateLocalAssets(localAssets.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleRemoveAsset = (id: string) => {
    updateLocalAssets(localAssets.filter(a => a.id !== id));
  };

  // Auto-fill volatility based on asset type
  const handleAutoFillParams = () => {
    const updated = localAssets.map(asset => {
      let vol = asset.volatility;
      let div = asset.dividendYield;

      // Only update if currently 0 or looks like default
      if (vol === 0) {
        switch(asset.type) {
          case 'Stock': vol = 18; break;
          case 'Bond': vol = 5; break;
          case 'Crypto': vol = 65; break;
          case 'RealEstate': vol = 8; break;
          case 'Commodity': vol = 15; break;
          case 'Cash': vol = 0.5; break;
        }
      }
      return { ...asset, volatility: vol };
    });
    updateLocalAssets(updated);
  };

  const handleSimulation = async (mode: SimulationMode) => {
    setIsGlobalUpdating(true);
    setShowSimMenu(false);
    
    // Reset statuses
    const initialStatuses: Record<string, { status: UpdateStatus; message?: string }> = {};
    localAssets.forEach(a => {
      initialStatuses[a.id] = { status: 'loading' };
    });
    setRowStatuses(initialStatuses);

    const updatedAssets = [...localAssets];
    
    await Promise.all(updatedAssets.map(async (asset, index) => {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

      if (asset.type === 'Cash') {
        setRowStatuses(prev => ({ ...prev, [asset.id]: { status: 'skipped', message: '現金' } }));
        return; 
      }

      // Determine percentage change based on mode
      let changePercent = 0;
      const volatility = asset.volatility > 0 ? asset.volatility : 15;

      switch (mode) {
        case 'bull':
          // Bull market: +5% to +20% (weighted by volatility)
          changePercent = 5 + (Math.random() * 15 * (volatility / 10));
          break;
        case 'bear':
          // Bear market: -5% to -20%
          changePercent = -5 - (Math.random() * 15 * (volatility / 10));
          break;
        case 'crash':
          // Crash: -20% to -40%
          changePercent = -20 - (Math.random() * 20 * (volatility / 10));
          break;
        case 'random':
        default:
          // Random walk based on volatility (approx weekly movement)
          changePercent = (Math.random() - 0.5) * (volatility / 2);
          break;
      }

      const newPrice = Math.max(0.01, asset.currentPrice * (1 + changePercent / 100));

      updatedAssets[index] = {
        ...asset,
        currentPrice: parseFloat(newPrice.toFixed(2)),
        weeklyChange: parseFloat(changePercent.toFixed(2))
      };

      setRowStatuses(prev => ({ ...prev, [asset.id]: { status: 'success' } }));
    }));

    updateLocalAssets(updatedAssets);
    setIsGlobalUpdating(false);
  };

  // Calculate stats based on LOCAL assets
  const stats = calculatePortfolioStats(localAssets);
  const totalValueHKD = stats.totalValue;

  const totalAllocation = localAssets.reduce((sum, asset) => {
    const localValue = asset.currentPrice * (asset.quantity || 0);
    const hkdValue = convertToHKD(localValue, asset.currency || 'HKD');
    const allocationPercent = totalValueHKD > 0 ? (hkdValue / totalValueHKD) * 100 : 0;
    return sum + allocationPercent;
  }, 0);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${
      hasUnsavedChanges ? 'border-amber-300 ring-2 ring-amber-100 shadow-md' : 
      isSimulationMode ? 'border-indigo-200 shadow-indigo-100' : 'border-slate-100'
    }`}>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b flex flex-wrap gap-2 justify-between items-center sticky left-0 right-0 z-10 transition-colors ${
        hasUnsavedChanges ? 'bg-amber-50/80 border-amber-200' :
        isSimulationMode ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
            isSimulationMode ? 'text-indigo-800' : 'text-slate-800'
          }`}>
            {isSimulationMode ? <Calculator className="w-5 h-5 text-indigo-600" /> : <PieChart className="w-5 h-5 text-brand-600" />}
            {title} 
            {isSimulationMode && <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full whitespace-nowrap">模擬模式</span>}
          </h2>
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-100 px-2 sm:px-3 py-1 rounded-full animate-pulse whitespace-nowrap">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">未儲存變更</span>
              <span className="sm:hidden">未存</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto mt-2 sm:mt-0">
          {/* Quick Auto-fill Button */}
          <button
            onClick={handleAutoFillParams}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
            title="根據資產類型自動填入波動率與預設殖利率"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">自動填風險</span>
          </button>

          {/* Simulation Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSimMenu(!showSimMenu)}
              disabled={isGlobalUpdating}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold rounded-lg transition-all shadow-sm ${
                isGlobalUpdating 
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGlobalUpdating ? 'animate-spin text-brand-500' : ''}`} />
              {isGlobalUpdating ? '計算中...' : '市場模擬'}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            
            {showSimMenu && !isGlobalUpdating && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider bg-slate-50/50">
                  一鍵套用情境
                </div>
                <button onClick={() => handleSimulation('random')} className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-400" /> 微幅震盪 (一般)
                </button>
                <button onClick={() => handleSimulation('bull')} className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-emerald-50 flex items-center gap-2 text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> 牛市爆發 (+15%)
                </button>
                <button onClick={() => handleSimulation('bear')} className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-rose-50 flex items-center gap-2 text-rose-700">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> 熊市修正 (-15%)
                </button>
                <button onClick={() => handleSimulation('crash')} className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-100 flex items-center gap-2 text-slate-900 border-t border-slate-100">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-900" /> 黑天鵝崩盤 (-30%)
                </button>
              </div>
            )}
             {showSimMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowSimMenu(false)}></div>
            )}
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border flex items-center gap-1 whitespace-nowrap ${
             hasUnsavedChanges ? 'bg-white border-slate-200 text-slate-400' :
             isSimulationMode ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
            <Coins className="w-3 h-3" />
            預覽: {formatCurrency(totalValueHKD)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="px-4 py-3 pl-6 w-[150px]">資產名稱</th>
              <th className="px-4 py-3 w-[140px]">代碼 (Symbol)</th>
              <th className="px-4 py-3 w-[140px]">類型/地區</th>
              <th className="px-4 py-3 w-[80px]">幣別</th>
              <th className="px-4 py-3 text-right w-[120px]">市價 (原幣)</th>
              <th className="px-4 py-3 text-right w-[100px]">持有數量</th>
              <th className="px-4 py-3 text-right w-[140px]">總價值 (HKD)</th>
              <th className="px-4 py-3 text-right w-[80px]">週漲跌</th>
              <th className="px-4 py-3 text-center w-[70px]">配置 %</th>
              <th className="px-4 py-3 text-center w-[70px]">成長 %</th>
              <th className="px-4 py-3 text-center w-[70px]">殖利率 %</th>
              <th className="px-4 py-3 text-center w-[70px]">波動 %</th>
              <th className="px-4 py-3 w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {localAssets.map((asset) => {
              const localValue = asset.currentPrice * (asset.quantity || 0);
              const hkdValue = convertToHKD(localValue, asset.currency || 'HKD');
              const allocationPercent = totalValueHKD > 0 ? (hkdValue / totalValueHKD) * 100 : 0;
              const rowStatus = rowStatuses[asset.id] || { status: 'idle' };

              return (
                <tr 
                  key={asset.id} 
                  className="group transition-all duration-200 hover:bg-slate-50 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative"
                >
                  <td className="px-4 py-3 pl-6">
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => handleUpdateAsset(asset.id, 'name', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-500 rounded px-2 py-1 outline-none font-medium text-slate-700 transition-all placeholder:text-slate-300"
                      placeholder="資產名稱"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                          <input
                          type="text"
                          value={asset.symbol || ''}
                          onChange={(e) => handleUpdateAsset(asset.id, 'symbol', e.target.value.toUpperCase())}
                          className={`w-full bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-500 rounded px-2 py-1 outline-none font-mono text-xs transition-all placeholder:text-slate-300 uppercase ${
                            !asset.symbol && rowStatus.status === 'error' ? 'border-amber-300 bg-amber-50' : 'text-slate-600'
                          }`}
                          placeholder="代碼"
                          />
                      </div>
                      {asset.symbol && (
                        <a 
                          href={`https://finance.yahoo.com/quote/${asset.symbol}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 text-slate-300 hover:text-brand-500 hover:bg-brand-50 rounded transition-colors"
                          title="前往 Yahoo Finance 查看"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <select
                        value={asset.type}
                        onChange={(e) => handleUpdateAsset(asset.id, 'type', e.target.value)}
                        className="w-1/2 text-xs bg-slate-100/50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded px-1 py-1 outline-none text-slate-600 transition-all cursor-pointer"
                      >
                        <option value="Stock">股票</option>
                        <option value="Bond">債券</option>
                        <option value="Cash">現金</option>
                        <option value="RealEstate">房產</option>
                        <option value="Crypto">加密</option>
                        <option value="Commodity">商品</option>
                      </select>
                      <select
                        value={asset.region}
                        onChange={(e) => handleUpdateAsset(asset.id, 'region', e.target.value)}
                        className="w-1/2 text-xs bg-slate-100/50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded px-1 py-1 outline-none text-slate-600 transition-all cursor-pointer"
                      >
                        <option value="US">美國</option>
                        <option value="Global">全球</option>
                        <option value="Asia">亞洲</option>
                        <option value="Europe">歐洲</option>
                        <option value="Emerging">新興</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={asset.currency || 'HKD'}
                      onChange={(e) => handleUpdateAsset(asset.id, 'currency', e.target.value)}
                      className="w-full text-xs font-mono bg-slate-100/50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded px-1 py-1 outline-none text-slate-700 transition-all cursor-pointer"
                    >
                      <option value="HKD">HKD</option>
                      <option value="USD">USD</option>
                      <option value="CNY">CNY</option>
                      <option value="JPY">JPY</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={asset.currentPrice}
                        onChange={(e) => handleUpdateAsset(asset.id, 'currentPrice', parseFloat(e.target.value))}
                        className="w-full text-right bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded py-1 px-2 text-sm outline-none font-mono text-slate-700 transition-all pr-7"
                        step="0.01"
                      />
                      {/* Status Indicator */}
                      <div className="absolute right-1">
                        {rowStatus.status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />}
                        {rowStatus.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {rowStatus.status === 'error' && (
                          <div className="group/err relative">
                            <XCircle className="w-3.5 h-3.5 text-rose-500 cursor-help" />
                            <span className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-rose-500 text-white text-[10px] rounded whitespace-nowrap hidden group-hover/err:block z-20">
                              {rowStatus.message || '更新失敗'}
                            </span>
                          </div>
                        )}
                         {rowStatus.status === 'skipped' && (
                          <div className="group/skip relative">
                             <Ban className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                             <span className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-slate-500 text-white text-[10px] rounded whitespace-nowrap hidden group-hover/skip:block z-20">
                              {rowStatus.message || '跳過'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={asset.quantity}
                      onChange={(e) => handleUpdateAsset(asset.id, 'quantity', parseFloat(e.target.value))}
                      className="w-full text-right bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded py-1 px-2 text-sm outline-none font-mono text-slate-700 transition-all"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-700 font-bold text-sm font-mono">
                        {formatCurrency(hkdValue)}
                      </span>
                      {asset.currency !== 'HKD' && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatCurrency(localValue, asset.currency)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                     <div className="relative flex items-center justify-end">
                      <span className={`text-xs font-bold mr-1 flex items-center ${
                          asset.weeklyChange > 0 ? 'text-emerald-600' : asset.weeklyChange < 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                        {asset.weeklyChange > 0 ? <TrendingUp className="w-3 h-3 mr-0.5"/> : asset.weeklyChange < 0 ? <TrendingDown className="w-3 h-3 mr-0.5"/> : null}
                        {Math.abs(asset.weeklyChange).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {allocationPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={asset.expectedReturn}
                      onChange={(e) => handleUpdateAsset(asset.id, 'expectedReturn', parseFloat(e.target.value))}
                      className="w-full text-center bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded py-1 outline-none transition-all text-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={asset.dividendYield}
                      onChange={(e) => handleUpdateAsset(asset.id, 'dividendYield', parseFloat(e.target.value))}
                      className="w-full text-center bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded py-1 outline-none transition-all text-slate-600"
                    />
                  </td>
                   <td className="px-4 py-3">
                    <input
                      type="number"
                      value={asset.volatility}
                      onChange={(e) => handleUpdateAsset(asset.id, 'volatility', parseFloat(e.target.value))}
                      className="w-full text-center bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded py-1 text-slate-500 outline-none transition-all"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="移除資產"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td colSpan={6} className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                投資組合總計
              </td>
              <td className="px-4 py-3 text-right font-bold font-mono text-slate-800">
                {formatCurrency(totalValueHKD)}
              </td>
              <td></td>
              <td className="px-4 py-3 text-center">
                <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${
                  Math.abs(totalAllocation - 100) < 0.1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {totalAllocation.toFixed(1)}%
                </div>
              </td>
              <td colSpan={4}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Actions Footer */}
      <div className={`px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 ${
        hasUnsavedChanges ? 'bg-amber-50/50 border-amber-200' :
        isSimulationMode ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-200'
      }`}>
        <button 
          onClick={handleAddAsset}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all ${
            isSimulationMode 
            ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 bg-white border border-indigo-100'
            : 'text-brand-600 hover:text-brand-700 hover:bg-brand-50 bg-white border border-brand-100'
          }`}
        >
          <Plus className="w-4 h-4" /> 
          新增資產項目
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {hasUnsavedChanges && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 shadow-md transition-all transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                確認並儲存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};