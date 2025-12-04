
import { CalculationParams, YearlyResult, Asset, PortfolioStats, SimulationResult, LifecycleEvent, StressTestScenario, StressTestResult, HKBenchmarkData, GapAnalysisResult, Currency } from '../types';

// Approximate Exchange Rates (Base: HKD)
export const EXCHANGE_RATES: Record<Currency, number> = {
  'HKD': 1,
  'USD': 7.80,
  'CNY': 1.08,
  'JPY': 0.052,
  'GBP': 9.85,
  'EUR': 8.45
};

// Helper to convert any currency to HKD
export const convertToHKD = (amount: number, currency: Currency): number => {
  const rate = EXCHANGE_RATES[currency] || 1;
  return amount * rate;
};

// Calculate Monthly Payment (PMT)
export const calculatePMT = (rate: number, nper: number, pv: number): number => {
  if (rate === 0) return pv / nper;
  const monthlyRate = rate / 100 / 12;
  return (pv * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -nper));
};

// Helper to calculate weighted stats based on Asset Value
export const calculatePortfolioStats = (assets: Asset[]): PortfolioStats => {
  let totalValueHKD = 0;
  
  // First pass: Calculate total value in HKD
  assets.forEach(asset => {
    const localValue = asset.currentPrice * (asset.quantity || 0);
    const hkdValue = convertToHKD(localValue, asset.currency || 'HKD');
    totalValueHKD += hkdValue;
  });

  if (totalValueHKD === 0) {
    return { 
      weightedReturn: 0, 
      weightedYield: 0, 
      weightedVolatility: 0,
      totalValue: 0 
    };
  }

  let weightedReturn = 0;
  let weightedYield = 0;
  let weightedVolatility = 0;

  // Second pass: Calculate weighted stats
  assets.forEach(asset => {
    const localValue = asset.currentPrice * (asset.quantity || 0);
    const hkdValue = convertToHKD(localValue, asset.currency || 'HKD');
    const weight = hkdValue / totalValueHKD;
    
    weightedReturn += asset.expectedReturn * weight;
    weightedYield += asset.dividendYield * weight;
    weightedVolatility += asset.volatility * weight;
    
    // Update the allocation percentage on the asset object for display
    asset.allocation = parseFloat((weight * 100).toFixed(1));
  });

  return { 
    weightedReturn, 
    weightedYield, 
    weightedVolatility,
    totalValue: totalValueHKD
  };
};

export const calculateRequiredCapital = (targetMonthlyIncome: number, annualYield: number): number => {
  if (annualYield <= 0) return 0;
  return (targetMonthlyIncome * 12) / (annualYield / 100);
};

export const calculateCompoundInterest = (
  params: CalculationParams, 
  events: LifecycleEvent[] = [],
  lifeExpectancy: number = 85
): YearlyResult[] => {
  // Determine effective retirement age (handle early retirement events)
  const earlyRetireEvent = events.find(e => e.type === 'RETIREMENT_EARLY');
  const effectiveRetirementAge = earlyRetireEvent 
    ? params.retirementAge - earlyRetireEvent.value 
    : params.retirementAge;

  const {
    currentAge,
    initialPrincipal,
    monthlyContribution,
    annualExtraContribution,
    assets,
    useManualReturn,
    manualReturnRate,
    manualDividendYield,
    mortgage,
    inflationRate = 0
  } = params;

  const { weightedReturn, weightedYield } = calculatePortfolioStats(assets);
  
  // Determine rates based on manual override flag
  let annualPriceAppreciation = useManualReturn ? manualReturnRate : weightedReturn;
  let annualDividendYield = useManualReturn ? manualDividendYield : weightedYield;

  const results: YearlyResult[] = [];
  const yearsToSimulate = lifeExpectancy - currentAge;
  const currentYear = new Date().getFullYear();

  if (yearsToSimulate <= 0) return results;

  let currentBalance = initialPrincipal;
  let totalContributed = initialPrincipal;
  let totalAppreciation = 0;
  let totalDividends = 0;
  
  // Mortgage Tracking
  let mortgageBalance = mortgage.hasMortgage ? mortgage.remainingPrincipal : 0;
  let mortgageMonthlyPayment = 0;
  if (mortgage.hasMortgage && mortgage.remainingPrincipal > 0 && mortgage.remainingYears > 0) {
      mortgageMonthlyPayment = mortgage.monthlyPayment > 0 
        ? mortgage.monthlyPayment 
        : calculatePMT(mortgage.annualRate, mortgage.remainingYears * 12, mortgage.remainingPrincipal);
  }
  let monthsRemainingOnMortgage = mortgage.hasMortgage ? mortgage.remainingYears * 12 : 0;

  // Initialize first year (Age start)
  results.push({
    age: currentAge,
    year: currentYear,
    totalPrincipal: totalContributed,
    totalAppreciation: 0,
    totalDividends: 0,
    totalBalance: currentBalance,
    totalLiabilities: mortgageBalance,
    netWorth: currentBalance - mortgageBalance,
    yearlyPassiveIncome: initialPrincipal * (annualDividendYield / 100),
    
    // Real Values (Year 0 is same as nominal)
    totalPrincipalReal: totalContributed,
    totalAppreciationReal: 0,
    totalDividendsReal: 0,
    totalBalanceReal: currentBalance,
    totalLiabilitiesReal: mortgageBalance,
    netWorthReal: currentBalance - mortgageBalance,
    yearlyPassiveIncomeReal: initialPrincipal * (annualDividendYield / 100),
  });

  for (let year = 1; year <= yearsToSimulate; year++) {
    const age = currentAge + year;
    const isRetired = age >= effectiveRetirementAge;

    // --- Check for Events applied at START of year ---
    const yearEvents = events.filter(e => age >= e.startAge && age < (e.startAge + (e.duration || 1)));
    
    const crashEvents = yearEvents.filter(e => e.type === 'MARKET_CRASH');
    crashEvents.forEach(e => {
      currentBalance = currentBalance * (1 - e.value / 100);
    });

    let effectiveAppreciation = annualPriceAppreciation;
    let effectiveYield = annualDividendYield;
    const returnEvents = yearEvents.filter(e => e.type === 'RETURN_REDUCTION');
    returnEvents.forEach(e => {
       effectiveAppreciation = effectiveAppreciation * (1 - e.value / 100);
       effectiveYield = effectiveYield * (1 - e.value / 100);
    });

    const expenseEvents = yearEvents.filter(e => e.type === 'ONE_TIME_EXPENSE' || e.type === 'RECURRING_EXPENSE');
    expenseEvents.forEach(e => {
      currentBalance -= e.value;
    });

    // --- Monthly Loop ---
    const monthlyAppreciationRate = effectiveAppreciation / 100 / 12;
    const monthlyDividendRate = effectiveYield / 100 / 12;
    const monthlyMortgageRate = (mortgage.annualRate / 100) / 12;
    
    let effectiveMonthlyContrib = isRetired ? 0 : monthlyContribution;
    const contribStopEvents = yearEvents.filter(e => e.type === 'CONTRIBUTION_STOP');
    if (contribStopEvents.length > 0) {
      effectiveMonthlyContrib = 0;
    }

    for (let month = 1; month <= 12; month++) {
      let extraInvestFromMortgage = 0;
      if (monthsRemainingOnMortgage > 0) {
          const interestPayment = mortgageBalance * monthlyMortgageRate;
          const principalPayment = mortgageMonthlyPayment - interestPayment;
          
          if (mortgageBalance > principalPayment) {
              mortgageBalance -= principalPayment;
          } else {
              mortgageBalance = 0;
          }
          monthsRemainingOnMortgage--;
      } else {
          if (mortgage.hasMortgage && mortgage.reinvestAfterPayoff) {
              extraInvestFromMortgage = mortgageMonthlyPayment;
          }
      }

      const totalMonthlyInput = effectiveMonthlyContrib + extraInvestFromMortgage;
      currentBalance += totalMonthlyInput;
      totalContributed += totalMonthlyInput;

      const appreciationAmount = currentBalance * monthlyAppreciationRate;
      const dividendAmount = currentBalance * monthlyDividendRate;

      totalAppreciation += appreciationAmount;
      totalDividends += dividendAmount;
      currentBalance += appreciationAmount + dividendAmount;
    }

    // --- Year End ---
    let effectiveAnnualContrib = isRetired ? 0 : annualExtraContribution;
    if (contribStopEvents.length > 0) {
      effectiveAnnualContrib = 0;
    }
    
    currentBalance += effectiveAnnualContrib;
    totalContributed += effectiveAnnualContrib;

    // --- Calculate Real Purchasing Power ---
    // Discount Factor = 1 / (1 + inflation)^years
    const discountFactor = Math.pow(1 + inflationRate / 100, -year);

    results.push({
      age: age,
      year: currentYear + year,
      totalPrincipal: Math.round(totalContributed),
      totalAppreciation: Math.round(totalAppreciation),
      totalDividends: Math.round(totalDividends),
      totalBalance: Math.round(currentBalance),
      totalLiabilities: Math.round(mortgageBalance),
      netWorth: Math.round(currentBalance - mortgageBalance),
      yearlyPassiveIncome: Math.round(currentBalance * (effectiveYield / 100)),

      // Real Values
      totalPrincipalReal: Math.round(totalContributed * discountFactor),
      totalAppreciationReal: Math.round(totalAppreciation * discountFactor),
      totalDividendsReal: Math.round(totalDividends * discountFactor),
      totalBalanceReal: Math.round(currentBalance * discountFactor),
      totalLiabilitiesReal: Math.round(mortgageBalance * discountFactor),
      netWorthReal: Math.round((currentBalance - mortgageBalance) * discountFactor),
      yearlyPassiveIncomeReal: Math.round((currentBalance * (effectiveYield / 100)) * discountFactor),
    });
  }

  return results;
};

// Box-Muller transform for generating normally distributed random numbers
const randn_bm = (): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); 
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
};

export const runMonteCarloSimulation = (params: CalculationParams, simulations: number = 500): SimulationResult[] => {
  const { weightedReturn, weightedYield, weightedVolatility } = calculatePortfolioStats(params.assets);
  
  const baseReturn = params.useManualReturn ? params.manualReturnRate : weightedReturn;
  const baseYield = params.useManualReturn ? params.manualDividendYield : weightedYield;
  
  const totalExpectedReturnMean = (baseReturn + baseYield) / 100;
  const volatilityStdDev = weightedVolatility / 100;
  
  const years = params.retirementAge - params.currentAge;
  const resultsByYear: number[][] = Array.from({ length: years + 1 }, () => []);

  for (let s = 0; s < simulations; s++) {
    let balance = params.initialPrincipal;
    resultsByYear[0].push(balance);

    for (let y = 1; y <= years; y++) {
      const annualContrib = (params.monthlyContribution * 12) + params.annualExtraContribution;
      const randomReturn = totalExpectedReturnMean + (volatilityStdDev * randn_bm());
      balance = balance * (1 + randomReturn) + annualContrib;
      if (balance < 0) balance = 0;
      resultsByYear[y].push(balance);
    }
  }

  const finalResults: SimulationResult[] = resultsByYear.map((balances, index) => {
    balances.sort((a, b) => a - b);
    return {
      year: new Date().getFullYear() + index,
      age: params.currentAge + index,
      p10: Math.round(balances[Math.floor(simulations * 0.1)]),
      p50: Math.round(balances[Math.floor(simulations * 0.5)]),
      p90: Math.round(balances[Math.floor(simulations * 0.9)]),
    };
  });

  return finalResults;
};

export const runStressTests = (params: CalculationParams): StressTestResult[] => {
  const baselineResults = calculateCompoundInterest(params, [], 85);
  const baselineBalance = baselineResults[baselineResults.length - 1]?.totalBalance || 0;

  const scenarios: StressTestScenario[] = [
    {
      id: 'unemployment',
      title: '中年失業危機',
      description: '40歲時失業 2 年，期間無法投入資金，且需消耗存款維持生活。',
      events: [
        { startAge: 40, duration: 2, type: 'CONTRIBUTION_STOP', value: 0 },
        { startAge: 40, duration: 2, type: 'RECURRING_EXPENSE', value: 300000 } 
      ]
    },
    {
      id: 'illness',
      title: '突發重病',
      description: '50歲時遭遇重大傷病，一次性支出 150 萬醫療費。',
      events: [
        { startAge: 50, duration: 1, type: 'ONE_TIME_EXPENSE', value: 1500000 }
      ]
    },
    {
      id: 'crash',
      title: '退休前夕崩盤',
      description: '退休該年遭遇金融海嘯，資產瞬間縮水 40%。',
      events: [
        { startAge: params.retirementAge, duration: 1, type: 'MARKET_CRASH', value: 40 }
      ]
    },
    {
      id: 'care',
      title: '長期照護需求',
      description: '75歲起需要長期照護，每年額外支出 48 萬，直到 85 歲。',
      events: [
        { startAge: 75, duration: 10, type: 'RECURRING_EXPENSE', value: 480000 }
      ]
    },
    {
      id: 'early_retire',
      title: '被迫提早退休',
      description: '因公司裁員或家庭因素，提早 5 年退休，縮短了累積期。',
      events: [
        { startAge: params.retirementAge - 5, duration: 1, type: 'RETIREMENT_EARLY', value: 5 }
      ]
    },
    {
      id: 'low_return',
      title: '長期低回報',
      description: '全球進入經濟停滯期，年化報酬率長期減少 30%。',
      events: [
        { startAge: params.currentAge, duration: 50, type: 'RETURN_REDUCTION', value: 30 }
      ]
    },
    {
      id: 'inflation',
      title: '惡性通膨',
      description: '購買力下降，相當於每年生活成本大增 (模擬為資產縮水)。',
      events: [
        { startAge: params.currentAge, duration: 50, type: 'RETURN_REDUCTION', value: 20 } 
      ]
    },
     {
      id: 'longevity',
      title: '長壽風險 (100歲)',
      description: '活到 100 歲，退休金是否足夠支撐多出來的 15 年？',
      events: [],
      customLifeExpectancy: 100
    },
    {
      id: 'perfect_storm',
      title: '完美風暴 (最慘)',
      description: '提早退休 + 退休崩盤 + 重病。地獄級難度。',
      events: [
        { startAge: params.retirementAge - 5, duration: 1, type: 'RETIREMENT_EARLY', value: 5 },
        { startAge: params.retirementAge - 5, duration: 1, type: 'MARKET_CRASH', value: 30 },
        { startAge: 60, duration: 1, type: 'ONE_TIME_EXPENSE', value: 1000000 }
      ]
    }
  ];

  return scenarios.map(scenario => {
    const lifeExpectancy = scenario.customLifeExpectancy || 85;
    const res = calculateCompoundInterest(params, scenario.events, lifeExpectancy);
    const finalBalance = res[res.length - 1]?.totalBalance || 0;
    
    // Check if bankrupt at any point
    const bankruptYear = res.find(r => r.totalBalance < 0);
    const isBankrupt = !!bankruptYear;
    
    let ratio = 0;
    if (baselineBalance > 0) {
      ratio = finalBalance / baselineBalance;
    }

    let status: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
    if (isBankrupt || finalBalance <= 0) status = 'DANGER';
    else if (ratio < 0.5) status = 'DANGER'; 
    else if (ratio < 0.8) status = 'WARNING'; 

    if (scenario.id === 'longevity' && finalBalance > 0) status = 'SAFE';
    
    return {
      scenario,
      finalBalance,
      baselineBalance,
      difference: finalBalance - baselineBalance,
      isBankrupt,
      bankruptAge: bankruptYear?.age,
      status
    };
  });
};

export const calculateGapAnalysis = (
  realStats: PortfolioStats,
  simulatedStats: PortfolioStats,
  yearsToRetirement: number
): GapAnalysisResult => {
  // Simple Future Value estimation: PV * (1+r)^n
  const fvReal = realStats.totalValue * Math.pow(1 + (realStats.weightedReturn + realStats.weightedYield)/100, yearsToRetirement);
  const fvSimulated = simulatedStats.totalValue * Math.pow(1 + (simulatedStats.weightedReturn + simulatedStats.weightedYield)/100, yearsToRetirement);
  
  const shortfall = fvSimulated - fvReal;
  const conservativeYield = 0.045; // 4.5% for Bonds
  
  // How much PV needed at conservative rate to bridge shortfall?
  let suggestedConservativeAmount = 0;
  if (shortfall > 0) {
    suggestedConservativeAmount = shortfall / Math.pow(1 + conservativeYield, yearsToRetirement);
  }

  return {
    shortfall,
    suggestedConservativeAmount,
    conservativeYield: conservativeYield * 100
  };
};

export const formatCurrency = (amount: number, currency: string = 'HKD') => {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateStressTestCSV = (results: StressTestResult[]) => {
  const headers = ['情境名稱', '情境描述', '最終資產餘額', '與基準差異', '狀態', '破產年齡'];
  const rows = results.map(r => [
    `"${r.scenario.title}"`,
    `"${r.scenario.description}"`,
    r.finalBalance,
    r.difference,
    r.status === 'SAFE' ? '安全' : r.status === 'WARNING' ? '警告' : '危險',
    r.bankruptAge || '-'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');
  
  return csvContent;
};

// Hong Kong Financial Benchmark Data
export const HK_BENCHMARKS: HKBenchmarkData[] = [
  { 
    ageRange: '20-24', minAge: 20, maxAge: 24, 
    medianIncome: 16500, medianAssets: 80000, 
    top10Income: 28000, top10Assets: 350000 
  },
  { 
    ageRange: '25-29', minAge: 25, maxAge: 29, 
    medianIncome: 21500, medianAssets: 250000, 
    top10Income: 45000, top10Assets: 1200000 
  },
  { 
    ageRange: '30-34', minAge: 30, maxAge: 34, 
    medianIncome: 25800, medianAssets: 600000, 
    top10Income: 65000, top10Assets: 2500000 
  },
  { 
    ageRange: '35-39', minAge: 35, maxAge: 39, 
    medianIncome: 30500, medianAssets: 1200000, 
    top10Income: 85000, top10Assets: 5000000 
  },
  { 
    ageRange: '40-44', minAge: 40, maxAge: 44, 
    medianIncome: 33000, medianAssets: 2200000, 
    top10Income: 95000, top10Assets: 8000000 
  },
  { 
    ageRange: '45-49', minAge: 45, maxAge: 49, 
    medianIncome: 34500, medianAssets: 3500000, 
    top10Income: 100000, top10Assets: 12000000 
  },
  { 
    ageRange: '50-59', minAge: 50, maxAge: 59, 
    medianIncome: 32000, medianAssets: 4500000, 
    top10Income: 90000, top10Assets: 15000000 
  },
  { 
    ageRange: '60+', minAge: 60, maxAge: 100, 
    medianIncome: 20000, medianAssets: 5000000, 
    top10Income: 60000, top10Assets: 20000000 
  }
];

export const getHKBenchmark = (age: number): HKBenchmarkData | undefined => {
  return HK_BENCHMARKS.find(b => age >= b.minAge && age <= b.maxAge) || HK_BENCHMARKS[HK_BENCHMARKS.length - 1];
};
