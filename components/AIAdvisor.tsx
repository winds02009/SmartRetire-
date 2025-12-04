
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CalculationParams, YearlyResult, PortfolioStats, SimulationResult } from '../types';
import { formatCurrency, getHKBenchmark } from '../utils/calculations';
import { BrainCircuit, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface AIAdvisorProps {
  params: CalculationParams;
  finalResult: YearlyResult | undefined;
  portfolioStats: PortfolioStats;
  simulationResults: SimulationResult[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ params, finalResult, portfolioStats, simulationResults }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const generateAdvice = async () => {
    if (!process.env.API_KEY) {
      setError("未設定 API Key，無法使用 AI 功能。");
      return;
    }

    if (!finalResult || simulationResults.length === 0) return;

    setLoading(true);
    setError('');
    setAdvice('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const benchmark = getHKBenchmark(params.currentAge);
      
      const assetAllocationStr = params.assets
        .filter(a => a.allocation > 0)
        .map(a => `- ${a.name} (${a.type}/${a.region}): ${a.allocation}%`)
        .join('\n');

      const worstCase = simulationResults[simulationResults.length - 1].p10;
      const bestCase = simulationResults[simulationResults.length - 1].p90;
      
      const finalPassiveMonthly = finalResult.yearlyPassiveIncome / 12;
      const isTargetMet = finalPassiveMonthly >= params.targetMonthlyIncome;

      let benchmarkInfo = "";
      if (benchmark) {
        benchmarkInfo = `
        **5. 香港同齡層對比 (${benchmark.ageRange}歲)：**
        - 使用者月收: ${formatCurrency(params.monthlyIncome)} (中位數: ${formatCurrency(benchmark.medianIncome)})
        - 使用者資產: ${formatCurrency(params.initialPrincipal)} (中位數: ${formatCurrency(benchmark.medianAssets)})
        - 收入表現: ${params.monthlyIncome > benchmark.medianIncome ? "優於" : "低於"}平均
        - 資產表現: ${params.initialPrincipal > benchmark.medianAssets ? "優於" : "低於"}平均
        `;
      }

      const prompt = `
        你是一位專業的退休理財規劃師。請根據使用者的投資組合、蒙地卡羅模擬結果以及香港市場數據進行繁體中文分析。

        **1. 投資組合配置：**
        ${assetAllocationStr}
        - 加權平均年化報酬：${portfolioStats.weightedReturn.toFixed(2)}%
        - 加權平均殖利率：${portfolioStats.weightedYield.toFixed(2)}%
        - 加權波動率(風險)：${portfolioStats.weightedVolatility.toFixed(2)}%

        **2. 目標與達成率：**
        - 目前 ${params.currentAge} 歲，預計 ${params.retirementAge} 歲退休。
        - **目標退休月被動收入**：${formatCurrency(params.targetMonthlyIncome)}
        - **預估退休時月被動收入(中位數)**：${formatCurrency(finalPassiveMonthly)}
        - 狀態：${isTargetMet ? "已達標" : "尚未達標 (落後)"}

        **3. 蒙地卡羅模擬 (退休時總資產)：**
        - 樂觀情境 (90th PR)：${formatCurrency(bestCase)}
        - 中位數 (Baseline)：${formatCurrency(finalResult.totalBalance)}
        - 悲觀情境 (10th PR)：${formatCurrency(worstCase)}
        
        ${benchmarkInfo}

        **請提供具體分析：**
        1.  **目標達成可行性分析**：
            請直接點評使用者設定的「每月 ${formatCurrency(params.targetMonthlyIncome)}」被動收入目標是否實際？根據目前的儲蓄率與投資回報，預估退休時能否達成？若未達標，請計算還差多少本金，或建議每月需多存多少錢。

        2.  **同齡層財富健檢**：
            根據香港數據，點評其財務位置。

        3.  **資產風險與集中度分析**：
            波動率 ${portfolioStats.weightedVolatility.toFixed(2)}% 是否適合想領取穩定股息的人？

        4.  **退休現金流策略建議**：
            - 如果目標是領股息，目前的殖利率 (${portfolioStats.weightedYield.toFixed(2)}%) 是否足夠？
            - 若不足，建議如何調整資產配置（例如增加債券或高股息ETF）來提升現金流穩定性，同時兼顧抗通膨？

        請用 Markdown 格式，語氣專業且具建設性。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAdvice(response.text || "無法產生建議，請稍後再試。");
    } catch (err) {
      console.error(err);
      setError("AI 連線發生錯誤，請檢查網路或 API Key。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-lg shadow-indigo-100/50 relative overflow-hidden mt-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">AI 智能投資組合健檢</h3>
            <p className="text-sm text-slate-500">基於資產分佈、同齡比較與蒙地卡羅模擬的專業建議</p>
          </div>
        </div>
        {!advice && !loading && (
          <button
            onClick={generateAdvice}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            分析風險
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-600 bg-slate-50/50 rounded-xl border border-indigo-50 border-dashed">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm font-medium">正在進行目標達成率分析與蒙地卡羅模擬...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {advice && (
        <div className="prose prose-sm prose-slate max-w-none bg-indigo-50/30 p-5 rounded-xl border border-indigo-100">
          <div className="markdown-content" dangerouslySetInnerHTML={{ 
            __html: advice.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-900">$1</strong>')
                          .replace(/\n/g, '<br/>')
                          .replace(/- /g, '• ') 
          }} />
          <div className="mt-4 flex justify-end">
            <button 
              onClick={generateAdvice}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              重新分析
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
