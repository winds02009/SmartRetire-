
import React, { useState, useEffect } from 'react';
import { CalculationParams, PortfolioStats } from '../types';
import { User, Wallet, CalendarClock, Banknote, SlidersHorizontal, Target, Percent, Calculator, CheckCircle2, Building, Home, ArrowDownCircle, TrendingUp, Lock } from 'lucide-react';
import { calculatePMT, formatCurrency } from '../utils/calculations';

interface CalculatorFormProps {
  params: CalculationParams;
  setParams: React.Dispatch<React.SetStateAction<CalculationParams>>;
  portfolioStats: PortfolioStats;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ params, setParams, portfolioStats }) => {
  // Local state for form fields to allow batch updates
  const [formData, setFormData] = useState({
    currentAge: params.currentAge,
    retirementAge: params.retirementAge,
    monthlyIncome: params.monthlyIncome,
    targetMonthlyIncome: params.targetMonthlyIncome,
    targetAnnualYield: params.targetAnnualYield,
    initialPrincipal: params.initialPrincipal,
    monthlyContribution: params.monthlyContribution,
    annualExtraContribution: params.annualExtraContribution,
    inflationRate: params.inflationRate,
    useManualReturn: params.useManualReturn,
    manualReturnRate: params.manualReturnRate,
    manualDividendYield: params.manualDividendYield,
    // Mortgage
    hasMortgage: params.mortgage.hasMortgage,
    mortgagePrincipal: params.mortgage.remainingPrincipal,
    mortgageRate: params.mortgage.annualRate,
    mortgageYears: params.mortgage.remainingYears,
    mortgagePayment: params.mortgage.monthlyPayment,
    reinvestAfterPayoff: params.mortgage.reinvestAfterPayoff,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [autoCalcMortgage, setAutoCalcMortgage] = useState(true);
  
  // Mortgage Estimator State
  const [showMortgageEstimator, setShowMortgageEstimator] = useState(false);
  const [propertyPrice, setPropertyPrice] = useState(6000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);

  // Sync local state when global params change (e.g., reset or load)
  useEffect(() => {
    setFormData({
      currentAge: params.currentAge,
      retirementAge: params.retirementAge,
      monthlyIncome: params.monthlyIncome,
      targetMonthlyIncome: params.targetMonthlyIncome,
      targetAnnualYield: params.targetAnnualYield,
      initialPrincipal: params.initialPrincipal,
      monthlyContribution: params.monthlyContribution,
      annualExtraContribution: params.annualExtraContribution,
      inflationRate: params.inflationRate,
      useManualReturn: params.useManualReturn,
      manualReturnRate: params.manualReturnRate,
      manualDividendYield: params.manualDividendYield,
      hasMortgage: params.mortgage.hasMortgage,
      mortgagePrincipal: params.mortgage.remainingPrincipal,
      mortgageRate: params.mortgage.annualRate,
      mortgageYears: params.mortgage.remainingYears,
      mortgagePayment: params.mortgage.monthlyPayment,
      reinvestAfterPayoff: params.mortgage.reinvestAfterPayoff,
    });
    setIsDirty(false);
  }, [
    params
  ]);

  // Auto-calculate PMT when mortgage fields change
  useEffect(() => {
    if (formData.hasMortgage && autoCalcMortgage) {
      const pmt = calculatePMT(formData.mortgageRate, formData.mortgageYears * 12, formData.mortgagePrincipal);
      // Only update if value is different significantly (avoid infinite loops with rounding)
      if (Math.abs(pmt - formData.mortgagePayment) > 1) {
          setFormData(prev => ({...prev, mortgagePayment: Math.round(pmt)}));
          setIsDirty(true);
      }
    }
  }, [formData.mortgagePrincipal, formData.mortgageRate, formData.mortgageYears, formData.hasMortgage, autoCalcMortgage]);

  // Mortgage Estimator Logic
  useEffect(() => {
    if (showMortgageEstimator && formData.hasMortgage) {
      const loanAmount = propertyPrice * (1 - downPaymentPercent / 100);
      if (Math.abs(loanAmount - formData.mortgagePrincipal) > 100) {
        setFormData(prev => ({ ...prev, mortgagePrincipal: Math.round(loanAmount) }));
        setIsDirty(true);
      }
    }
  }, [propertyPrice, downPaymentPercent, showMortgageEstimator, formData.hasMortgage]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
    }));
    setIsDirty(true);
  };

  const handleCalculate = () => {
    setParams(prev => ({
      ...prev,
      currentAge: formData.currentAge,
      retirementAge: formData.retirementAge,
      monthlyIncome: formData.monthlyIncome,
      targetMonthlyIncome: formData.targetMonthlyIncome,
      targetAnnualYield: formData.targetAnnualYield,
      initialPrincipal: formData.initialPrincipal,
      monthlyContribution: formData.monthlyContribution,
      annualExtraContribution: formData.annualExtraContribution,
      inflationRate: formData.inflationRate,
      useManualReturn: formData.useManualReturn,
      manualReturnRate: formData.manualReturnRate,
      manualDividendYield: formData.manualDividendYield,
      mortgage: {
        hasMortgage: formData.hasMortgage,
        remainingPrincipal: formData.mortgagePrincipal,
        annualRate: formData.mortgageRate,
        remainingYears: formData.mortgageYears,
        monthlyPayment: formData.mortgagePayment,
        reinvestAfterPayoff: formData.reinvestAfterPayoff
      }
    }));
    setIsDirty(false);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-colors duration-300 overflow-hidden mb-6 ${isDirty ? 'border-brand-300 shadow-brand-100' : 'border-slate-100'}`}>
      <div className={`px-4 sm:px-6 py-4 border-b flex justify-between items-center ${isDirty ? 'bg-brand-50 border-brand-200' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-brand-600" />
          基礎規劃參數
        </h2>
        {isDirty && <span className="text-xs text-brand-600 font-medium animate-pulse">數值已變更</span>}
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Section 1: Time Horizon */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" /> 個人規劃
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">現在年齡</label>
              <input
                type="number"
                name="currentAge"
                value={formData.currentAge}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">預計退休</label>
              <input
                type="number"
                name="retirementAge"
                value={formData.retirementAge}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div className="md:col-span-2 border-t border-slate-100 my-1"></div>

            {/* Income Comparison Group */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-slate-500" />
                目前月收入 (HKD)
              </label>
              <input
                type="number"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="用於與同齡層比較"
              />
            </div>
          </div>

          {/* Target Section Box */}
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
             <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-900">退休被動收入目標</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-indigo-700">目標每月領取 (HKD)</label>
                  <input
                    type="number"
                    name="targetMonthlyIncome"
                    value={formData.targetMonthlyIncome}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 text-indigo-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="30000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-indigo-700" title="用於計算達成目標所需的本金總額">
                    退休後預估殖利率 (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="targetAnnualYield"
                      value={formData.targetAnnualYield}
                      onChange={handleChange}
                      className="w-full pl-3 pr-7 py-2 bg-white border border-indigo-200 text-indigo-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="5.0"
                      step="0.1"
                    />
                    <Percent className="w-3 h-3 text-indigo-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>
             </div>
             <p className="text-[10px] text-indigo-400 mt-2 flex items-start gap-1">
               <SlidersHorizontal className="w-3 h-3 mt-0.5 shrink-0" />
               <span className="leading-tight">
                 此數值僅用於計算「財務自由目標本金」(FIRE Number)。<br/>
                 假設您退休後會將資產轉配置為殖利率 {formData.targetAnnualYield}% 的組合，與目前累積期的投資報酬率無關。
               </span>
             </p>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 2: Contributions */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4" /> 資金投入
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
              初始資金 (HKD)
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                模擬起始金額
              </span>
            </label>
            <div className="relative group">
              <span className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500">$</span>
              <input
                type="number"
                name="initialPrincipal"
                value={formData.initialPrincipal}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="輸入模擬運算的起始本金"
              />
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              * 此金額用於複利圖表模擬，與上方「真實總資產」分開計算。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">每月定期定額</label>
              <div className="relative group">
                <span className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500">$</span>
                <input
                  type="number"
                  name="monthlyContribution"
                  value={formData.monthlyContribution}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">每年額外投入</label>
              <div className="relative group">
                <span className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500">$</span>
                <input
                  type="number"
                  name="annualExtraContribution"
                  value={formData.annualExtraContribution}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 2.5: Mortgage */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4" /> 樓宇按揭 / 負債
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="hasMortgage"
                  checked={formData.hasMortgage}
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
           </div>
           
           {formData.hasMortgage && (
             <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Estimator Toggle */}
                <div className="flex justify-end">
                   <button 
                     onClick={() => setShowMortgageEstimator(!showMortgageEstimator)}
                     className="text-[10px] flex items-center gap-1 bg-white border border-rose-200 text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors shadow-sm"
                   >
                     <Calculator className="w-3 h-3" />
                     {showMortgageEstimator ? '隱藏樓價估算' : '按揭計算機 (由樓價反推)'}
                   </button>
                </div>

                {/* Estimator Section */}
                {showMortgageEstimator && (
                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="sm:col-span-2 flex items-center gap-2 pb-1 border-b border-rose-50 mb-1">
                        <Home className="w-3 h-3 text-rose-400" />
                        <span className="text-xs font-bold text-rose-800">樓價估算工具</span>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-medium text-slate-500">物業估價 (HKD)</label>
                         <input
                           type="number"
                           value={propertyPrice}
                           onChange={(e) => setPropertyPrice(Number(e.target.value))}
                           className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-rose-400 outline-none"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-medium text-slate-500">首期比例 (%)</label>
                         <div className="relative">
                            <input
                              type="number"
                              value={downPaymentPercent}
                              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-rose-400 outline-none pr-6"
                            />
                            <Percent className="w-3 h-3 absolute right-2 top-1.5 text-slate-400" />
                         </div>
                      </div>
                      <div className="sm:col-span-2 text-right">
                         <p className="text-[10px] text-slate-400">
                           需支付首期: <span className="font-medium text-slate-600">{formatCurrency(propertyPrice * (downPaymentPercent/100))}</span>
                         </p>
                         <div className="flex items-center justify-end gap-1 mt-1 text-xs font-bold text-rose-600">
                           <ArrowDownCircle className="w-3 h-3" />
                           貸款金額: {formatCurrency(propertyPrice * (1 - downPaymentPercent/100))}
                         </div>
                      </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-rose-800">尚欠本金 (HKD)</label>
                    <input
                      type="number"
                      name="mortgagePrincipal"
                      value={formData.mortgagePrincipal}
                      onChange={handleChange}
                      readOnly={showMortgageEstimator} // Read-only if estimator is active
                      className={`w-full px-3 py-2 border border-rose-200 text-rose-900 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm ${showMortgageEstimator ? 'bg-slate-100 cursor-not-allowed opacity-80' : 'bg-white'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-rose-800">年利率 (%)</label>
                    <input
                      type="number"
                      name="mortgageRate"
                      value={formData.mortgageRate}
                      onChange={handleChange}
                      step="0.1"
                      className="w-full px-3 py-2 bg-white border border-rose-200 text-rose-900 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-rose-800">剩餘年期</label>
                    <input
                      type="number"
                      name="mortgageYears"
                      value={formData.mortgageYears}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-rose-200 text-rose-900 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1 relative">
                    <label className="text-xs font-medium text-rose-800 flex justify-between">
                       每月供款
                       <button onClick={() => setAutoCalcMortgage(!autoCalcMortgage)} className="text-[10px] underline opacity-70 hover:opacity-100">
                         {autoCalcMortgage ? '手動輸入' : '自動計算'}
                       </button>
                    </label>
                    <input
                      type="number"
                      name="mortgagePayment"
                      value={formData.mortgagePayment}
                      onChange={(e) => {
                         handleChange(e);
                         setAutoCalcMortgage(false); // Disable auto calc if user types
                      }}
                      className={`w-full px-3 py-2 bg-white border border-rose-200 text-rose-900 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm ${autoCalcMortgage ? 'bg-slate-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-rose-200/50">
                    <input 
                      type="checkbox" 
                      id="reinvest"
                      name="reinvestAfterPayoff"
                      checked={formData.reinvestAfterPayoff}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <div>
                      <label htmlFor="reinvest" className="text-xs font-bold text-rose-900 cursor-pointer">
                        還清後自動轉投資
                      </label>
                      <p className="text-[10px] text-rose-700/70">
                        當房貸還清後，系統將模擬把原本的供款金額 (${Math.round(formData.mortgagePayment)}) 加入每月定期投資。
                      </p>
                    </div>
                </div>
             </div>
           )}
        </div>

        <hr className="border-slate-100" />

         {/* Section 3: Compound Interest Parameters (Manual Override) */}
         <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> 資產複利模擬參數
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 font-medium cursor-pointer" htmlFor="manual-mode">
                手動設定
              </label>
              <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  name="useManualReturn" 
                  id="manual-mode" 
                  checked={formData.useManualReturn} 
                  onChange={handleChange}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-brand-600 transition-all duration-200"
                />
                <label htmlFor="manual-mode" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors ${formData.useManualReturn ? 'bg-brand-600' : 'bg-slate-300'}`}></label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Inflation Rate Input */}
             <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                預期每年通膨率 (Inflation Rate)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="inflationRate"
                  value={formData.inflationRate}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full pr-8 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400">
                設定後可於右側圖表切換查看「實質購買力 (Real Purchasing Power)」。
              </p>
            </div>

            <div className={`space-y-2 transition-all duration-300 ${formData.useManualReturn ? 'opacity-100' : 'opacity-60 grayscale'}`}>
              <label className="text-sm font-medium text-slate-700">預期股價年增長</label>
              <div className="relative">
                <input
                  type="number"
                  name="manualReturnRate"
                  value={formData.useManualReturn ? formData.manualReturnRate : portfolioStats.weightedReturn.toFixed(2)}
                  onChange={handleChange}
                  readOnly={!formData.useManualReturn}
                  className={`w-full pr-8 pl-4 py-2 border rounded-lg outline-none transition-all ${
                    formData.useManualReturn 
                    ? 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-brand-500' 
                    : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400">%</span>
              </div>
            </div>

            <div className={`space-y-2 transition-all duration-300 ${formData.useManualReturn ? 'opacity-100' : 'opacity-60 grayscale'}`}>
              <label className="text-sm font-medium text-slate-700">預期股息殖利率</label>
               <div className="relative">
                <input
                  type="number"
                  name="manualDividendYield"
                  value={formData.useManualReturn ? formData.manualDividendYield : portfolioStats.weightedYield.toFixed(2)}
                  onChange={handleChange}
                  readOnly={!formData.useManualReturn}
                  className={`w-full pr-8 pl-4 py-2 border rounded-lg outline-none transition-all ${
                    formData.useManualReturn 
                    ? 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-brand-500' 
                    : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400">%</span>
              </div>
            </div>
          </div>
          {!formData.useManualReturn && (
            <p className="text-xs text-center text-slate-400 mt-2">目前數值由下方資產配置加權自動計算</p>
          )}
        </div>
      </div>

      <div className={`px-4 sm:px-6 py-4 border-t transition-colors duration-300 ${isDirty ? 'bg-brand-50 border-brand-100' : 'bg-slate-50 border-slate-100'}`}>
        <button
          onClick={handleCalculate}
          disabled={!isDirty}
          className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
            isDirty 
            ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200 ring-2 ring-brand-200 ring-offset-2 transform active:scale-[0.98] cursor-pointer' 
            : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed opacity-70'
          }`}
        >
          {isDirty ? (
            <Calculator className="w-5 h-5 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {isDirty ? '更新試算結果' : '目前資料已是最新'}
        </button>
        {isDirty && (
            <p className="text-center text-xs text-brand-600 mt-2 font-medium animate-pulse">
                參數已修改，請點擊按鈕以更新圖表與分析
            </p>
        )}
      </div>
    </div>
  );
};
