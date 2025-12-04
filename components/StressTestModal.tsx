
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, AlertOctagon, Printer, Download, Siren } from 'lucide-react';
import { CalculationParams, StressTestResult } from '../types';
import { runStressTests, formatCurrency, generateStressTestCSV } from '../utils/calculations';

interface StressTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CalculationParams;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({ isOpen, onClose, params }) => {
  const [results, setResults] = useState<StressTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Small delay to allow UI to render modal before heavy calc
      setTimeout(() => {
        const res = runStressTests(params);
        setResults(res);
        setLoading(false);
      }, 100);
    }
  }, [isOpen, params]);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvContent = generateStressTestCSV(results);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartRetire_StressTest_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print:p-0">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden print:w-full print:h-full print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm print:bg-white print:border-b-2 print:border-slate-900">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-lg text-rose-600 print:hidden">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">人生財務壓力測試報告</h2>
              <p className="text-sm text-slate-500 print:text-slate-600">模擬 9 種極端情境下的退休金存活率</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <button 
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" /> CSV 匯出
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Printer className="w-4 h-4" /> 列印 / 另存 PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 bg-slate-50/50 print:bg-white print:p-8 print:overflow-visible">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin"></div>
              <p>正在模擬平行宇宙的你...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 print:grid-cols-3 print:gap-4">
                {results.map((res) => (
                  <div 
                    key={res.scenario.id}
                    className={`relative p-5 rounded-xl border-2 transition-all ${
                      res.status === 'SAFE' ? 'bg-white border-emerald-100 hover:border-emerald-300' :
                      res.status === 'WARNING' ? 'bg-amber-50/30 border-amber-100 hover:border-amber-300' :
                      'bg-rose-50/30 border-rose-100 hover:border-rose-300'
                    } print:break-inside-avoid print:border`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-slate-800 text-lg">{res.scenario.title}</h3>
                      {res.status === 'SAFE' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                      {res.status === 'WARNING' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
                      {res.status === 'DANGER' && <AlertOctagon className="w-6 h-6 text-rose-500" />}
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2 print:h-auto">{res.scenario.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-400 uppercase">最終資產</span>
                        <span className={`font-mono font-bold text-lg ${
                          res.finalBalance > 0 ? 'text-slate-700' : 'text-rose-600'
                        }`}>
                          {formatCurrency(res.finalBalance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-medium text-slate-400 uppercase">資產減損</span>
                         <span className="text-xs font-medium text-slate-500">
                           {res.difference < 0 ? '-' : '+'}{formatCurrency(Math.abs(res.difference))}
                         </span>
                      </div>

                      {res.isBankrupt && (
                        <div className="mt-3 pt-3 border-t border-rose-100 flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                          <AlertOctagon className="w-4 h-4" />
                          <span className="text-xs font-bold">{res.bankruptAge} 歲時破產</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 print:border-slate-800 print:mt-8">
                <h4 className="font-bold text-slate-800 mb-2">💡 分析總結</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  在基準情境下，您的退休資產預估為 <strong>{formatCurrency(results[0]?.baselineBalance)}</strong>。
                  壓力測試顯示，在 <strong className="text-rose-600">{results.filter(r => r.status === 'DANGER').length} 個情境</strong> 下您面臨破產風險。
                  
                  {results.some(r => r.scenario.id === 'unemployment' && r.status === 'DANGER') && (
                    <span className="block mt-1">⚠️ 您的資產累積期對現金流中斷非常敏感，建議準備至少 6-12 個月的緊急預備金。</span>
                  )}
                  {results.some(r => r.scenario.id === 'illness' && r.status === 'DANGER') && (
                    <span className="block mt-1">⚠️ 重大傷病可能導致財務崩潰，建議檢視重大傷病險或醫療險保額是否足夠。</span>
                  )}
                  {results.some(r => r.scenario.id === 'crash' && r.status === 'DANGER') && (
                    <span className="block mt-1">⚠️ 您的退休金對市場崩盤承受度低，建議接近退休時（退休前 5-10 年）逐漸降低高波動資產比例。</span>
                  )}
                </p>
              </div>
              
              <div className="mt-8 text-center text-xs text-slate-400 print:block hidden">
                報表產生日期: {new Date().toLocaleDateString()} | SmartRetire Pro 壓力測試報告
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .absolute {
            position: static !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:w-full {
            width: 100% !important;
            max-width: none !important;
          }
          .print\\:h-full {
            height: auto !important;
          }
          .print\\:border-slate-900 {
            border-color: #0f172a !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          /* Make modal content visible */
          .fixed > div:last-child,
          .fixed > div:last-child * {
            visibility: visible;
          }
          /* Reset scroll */
          .overflow-y-auto {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
};
