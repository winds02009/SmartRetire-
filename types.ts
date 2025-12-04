
export type AssetType = 'Stock' | 'Bond' | 'Cash' | 'Crypto' | 'RealEstate' | 'Commodity';
export type Region = 'US' | 'Global' | 'Asia' | 'Europe' | 'Emerging';
export type Currency = 'HKD' | 'USD' | 'CNY' | 'JPY' | 'GBP' | 'EUR';

export interface Asset {
  id: string;
  name: string;
  symbol?: string; // Stock Ticker (e.g., AAPL, 0005.HK)
  type: AssetType;
  region: Region;
  currency: Currency; // Added currency field
  allocation: number; // Percentage 0-100 (Derived from value)
  quantity: number; // Number of units held
  expectedReturn: number; // Annual %
  dividendYield: number; // Annual %
  volatility: number; // Standard Deviation % (Risk)
  
  // Market Data
  currentPrice: number; // In local currency
  weeklyChange: number; // Percentage
}

export interface MortgageParams {
  hasMortgage: boolean;
  remainingPrincipal: number; // HKD
  annualRate: number; // %
  remainingYears: number;
  monthlyPayment: number; // HKD (Can be auto-calculated)
  reinvestAfterPayoff: boolean; // If true, monthlyPayment is added to monthlyContribution after payoff
}

export interface CalculationParams {
  currentAge: number;
  retirementAge: number;
  monthlyIncome: number;
  targetMonthlyIncome: number; // User's goal for passive income
  targetAnnualYield: number;   // User's expected yield for FIRE calculation
  initialPrincipal: number; // Derived from assets total value (in HKD)
  monthlyContribution: number;
  annualExtraContribution: number;
  inflationRate: number; // New: Expected annual inflation rate
  
  // Mortgage / Liabilities
  mortgage: MortgageParams;

  // Manual Override for returns
  useManualReturn: boolean;
  manualReturnRate: number;   // Price Appreciation %
  manualDividendYield: number; // Dividend Yield %

  assets: Asset[];
  simulatedAssets: Asset[]; // For "Ideal" portfolio comparison
  
  lastPortfolioUpdate?: number; // Timestamp of last confirmed save
}

export interface YearlyResult {
  age: number;
  year: number;
  
  // Nominal Values (Face Value)
  totalPrincipal: number;
  totalAppreciation: number;
  totalDividends: number;
  totalBalance: number; // Total Assets
  totalLiabilities: number; // Remaining Mortgage
  netWorth: number; // Assets - Liabilities
  yearlyPassiveIncome: number;

  // Real Values (Adjusted for Inflation / Purchasing Power)
  totalPrincipalReal: number;
  totalAppreciationReal: number;
  totalDividendsReal: number;
  totalBalanceReal: number;
  totalLiabilitiesReal: number;
  netWorthReal: number;
  yearlyPassiveIncomeReal: number;

  simulatedTotalBalance?: number;
  simulatedTotalBalanceReal?: number;
}

export interface SimulationResult {
  year: number;
  age: number;
  p10: number; // Pessimistic (10th percentile)
  p50: number; // Median
  p90: number; // Optimistic (90th percentile)
}

export interface PortfolioStats {
  weightedReturn: number;
  weightedYield: number;
  weightedVolatility: number;
  totalValue: number; // In HKD
}

export enum CalculationView {
  CHART = 'CHART',
  TABLE = 'TABLE'
}

// Stress Test Related Types
export type SimulationEventType = 
  | 'CONTRIBUTION_STOP'      
  | 'ONE_TIME_EXPENSE'       
  | 'RECURRING_EXPENSE'      
  | 'MARKET_CRASH'           
  | 'RETURN_REDUCTION'       
  | 'RETIREMENT_EARLY';      

export interface LifecycleEvent {
  startAge: number;
  duration?: number; 
  type: SimulationEventType;
  value: number; 
  name?: string;
}

export interface StressTestScenario {
  id: string;
  title: string;
  description: string;
  events: LifecycleEvent[];
  customRetirementAge?: number; 
  customLifeExpectancy?: number;
}

export interface StressTestResult {
  scenario: StressTestScenario;
  finalBalance: number;
  baselineBalance: number;
  difference: number;
  isBankrupt: boolean;
  bankruptAge?: number;
  status: 'SAFE' | 'WARNING' | 'DANGER'; 
}

export interface HKBenchmarkData {
  ageRange: string;
  minAge: number;
  maxAge: number;
  medianIncome: number; 
  medianAssets: number; 
  top10Income: number;
  top10Assets: number;
}

export interface GapAnalysisResult {
  shortfall: number;
  suggestedConservativeAmount: number; // Amount needed in conservative assets (e.g. Bonds)
  conservativeYield: number; // Assumed yield for suggestion (e.g. 4.5%)
}
