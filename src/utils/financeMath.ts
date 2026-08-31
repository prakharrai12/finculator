/**
 * Finculator Core Financial Math Engine (TypeScript v2)
 * Comprehensive TypeScript models & functions
 */

export interface EMICalculationResult {
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  processingFee: number;
  netTotalCost: number;
  principalPercent: number;
  interestPercent: number;
}

export interface AmortizationScheduleResult {
  monthlySchedule: Array<any>;
  yearlySchedule: Array<any>;
  actualMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalExtraPaid: number;
  totalCost: number;
}

export interface LoanEligibilityResult {
  maxLoanAmount: number;
  maxAvailableEMI: number;
  foirAmount: number;
  totalPayable: number;
  totalInterest: number;
}

export interface CreditCardPayoffResult {
  minPlan: { months: number; totalPaid: number; totalInterest: number; initialMonthly: number; schedule: any[] };
  fixedPlan: { months: number; totalPaid: number; totalInterest: number; monthlyPayment: number; schedule: any[] };
  savings: { interestSaved: number; monthsSaved: number; yearsSaved: number };
}

export interface FixedDepositResult {
  principal: number;
  maturityAmount: number;
  totalInterest: number;
  tenureMonths: number;
  interestPercent: number;
}

export interface RecurringDepositResult {
  monthlyDeposit: number;
  totalInvested: number;
  maturityAmount: number;
  totalInterest: number;
  tenureMonths: number;
}

export interface PPFResult {
  annualDeposit: number;
  totalInvested: number;
  totalInterest: number;
  maturityAmount: number;
  yearlyBreakdown: any[];
}

export interface GoalSavingsResult {
  targetCorpus: number;
  monthlySavings: number;
  annualSavings: number;
  initialSavings: number;
  initialFutureValue: number;
  shortfall: number;
  totalDeposits: number;
  estimatedReturns: number;
}

export interface StepUpSIPResult {
  totalInvested: number;
  estimatedReturns: number;
  futureValue: number;
  wealthGainMultiple: number;
  finalMonthly: number;
  yearlyBreakdown: any[];
}

export interface IncomeTaxResult {
  grossIncome: number;
  newRegime: { taxableIncome: number; totalTax: number; effectiveRate: number; takeHome: number };
  oldRegime: { taxableIncome: number; totalTax: number; effectiveRate: number; takeHome: number };
  recommendedRegime: string;
  savingsWithRecommended: number;
  selectedTax: number;
  effectiveRate: number;
  netTakeHome: number;
}

export interface GSTResult {
  netAmount: number;
  gstAmount: number;
  totalAmount: number;
  cgst: number;
  sgst: number;
  ratePercent: number;
}

export interface TakeHomeSalaryResult {
  annualCTC: number;
  monthlyGross: number;
  netAnnualSalary: number;
  netMonthlySalary: number;
  employeePFMonthly: number;
  taxMonthly: number;
  totalDeductionsMonthly: number;
  annualTax: number;
}

export interface ProfitMarginResult {
  costPrice: number;
  sellingPrice: number;
  profitPerUnit: number;
  totalProfit: number;
  grossMarginPct: number;
  markupPct: number;
  totalRevenue: number;
  totalCost: number;
}

export interface BreakEvenResult {
  fixedCosts: number;
  variableCostPerUnit: number;
  salesPricePerUnit: number;
  contributionMargin: number;
  cmRatio: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
}

export interface NetWorthResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  debtToAssetRatio: number;
  assetsBreakdown: Array<{ label: string; value: number; percent: number }>;
  liabilitiesBreakdown: Array<{ label: string; value: number }>;
}

export interface BuyVsRentResult {
  initialDownPayment: number;
  monthlyMortgage: number;
  finalHomeValue: number;
  finalBuyerNetWorth: number;
  finalRenterNetWorth: number;
  netAdvantage: number;
  winner: string;
  horizonYears: number;
  trajectory: any[];
}

export {
  round2,
  calculateEMI,
  generateAmortizationSchedule,
  calculateMortgagePayoffComparison,
  calculateLoanEligibility,
  calculateCreditCardPayoff,
  calculateCompoundInterest,
  calculateSimpleInterest,
  calculateFixedDeposit,
  calculateRecurringDeposit,
  calculatePPF,
  calculateGoalSavings,
  calculateSIP,
  calculateStepUpSIP,
  calculateSIPLumpCombined,
  calculateLumpSum,
  calculateCAGR,
  calculateInvestmentReturns,
  calculateIncomeTax,
  calculateGST,
  calculateTakeHomeSalary,
  calculateProfitMargin,
  calculateBreakEven,
  calculateNetWorth,
  calculateBudget50_30_20,
  calculateBuyVsRent,
  calculateInflation,
  calculateFIRE
} from '../../js/math/financeMath.js';
