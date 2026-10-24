import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
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
  TAX_CONFIG,
  calculateGST,
  calculateTakeHomeSalary,
  calculateProfitMargin,
  calculateBreakEven,
  calculateNetWorth,
  calculateBudget50_30_20,
  calculateBuyVsRent,
  calculateInflation,
  calculateFIRE
} from '../js/math/financeMath.js';

import {
  getDefaultPortfolioState,
  calculatePortfolioMetrics
} from '../js/math/portfolioMath.js';

describe('Finculator Core Financial Math Engine', () => {

  describe('1. EMI Calculation', () => {
    it('calculates standard home loan EMI with golden RBI/SBI values', () => {
      // 10 Lakhs at 8.5% for 20 years (240 months)
      const res = calculateEMI(1000000, 8.5, 240);
      assert.equal(res.monthlyEMI, 8678.23);
      assert.equal(res.totalPayment, 2082775.20);
      assert.equal(res.totalInterest, 1082775.20);
    });

    it('handles zero principal without division by zero', () => {
      const res = calculateEMI(0, 8.5, 240);
      assert.equal(res.monthlyEMI, 0);
      assert.equal(res.totalPayment, 0);
      assert.equal(res.totalInterest, 0);
    });

    it('handles zero percent interest rate (linear principal division)', () => {
      const res = calculateEMI(120000, 0, 12);
      assert.equal(res.monthlyEMI, 10000);
      assert.equal(res.totalInterest, 0);
      assert.equal(res.totalPayment, 120000);
    });

    it('handles processing fees correctly', () => {
      const res = calculateEMI(1000000, 8.5, 240, 1.0); // 1% fee = 10,000
      assert.equal(res.processingFee, 10000);
      assert.equal(res.netTotalCost, 2092775.20);
    });
  });

  describe('2. Amortization Schedule & Rounding Drift', () => {
    it('completes amortization with exactly 0.00 closing balance at final month', () => {
      const res = generateAmortizationSchedule(500000, 9.0, 60);
      assert.equal(res.actualMonths, 60);
      const lastMonth = res.monthlySchedule[res.monthlySchedule.length - 1];
      assert.equal(lastMonth.closingBalance, 0);
      assert.equal(lastMonth.month, 60);
      // Verify total principal paid matches original principal
      assert.equal(Math.round(res.totalPrincipalPaid), 500000);
    });

    it('accelerates payoff and reduces total tenure with extra monthly prepayments', () => {
      const standard = generateAmortizationSchedule(1000000, 9.0, 240, 0, 0);
      const prepaid = generateAmortizationSchedule(1000000, 9.0, 240, 5000, 0);
      assert.ok(prepaid.actualMonths < standard.actualMonths);
      assert.ok(prepaid.totalInterestPaid < standard.totalInterestPaid);
      const lastMonth = prepaid.monthlySchedule[prepaid.monthlySchedule.length - 1];
      assert.equal(lastMonth.closingBalance, 0);
    });
  });

  describe('3. Mortgage Payoff Comparison', () => {
    it('accurately computes interest and time saved', () => {
      const res = calculateMortgagePayoffComparison(2000000, 8.5, 240, 5000, 25000);
      assert.ok(res.savings.interestSaved > 0);
      assert.ok(res.savings.monthsSaved > 0);
      assert.equal(res.savings.yearsSaved, round2(res.savings.monthsSaved / 12));
    });
  });

  describe('4. Loan Eligibility & Borrowing Power', () => {
    it('reverse-solves max loan eligibility under FOIR constraints', () => {
      // Monthly income 150k, existing EMIs 20k, FOIR 50% -> available EMI = 55k
      const res = calculateLoanEligibility(150000, 20000, 8.5, 240, 50);
      assert.equal(res.foirAmount, 75000);
      assert.equal(res.maxAvailableEMI, 55000);
      assert.ok(res.maxLoanAmount > 6000000); // 55k/mo at 8.5% for 20y qualifies ~6.33M
      // Cross-check: EMI on maxLoanAmount should match available EMI
      const checkEMI = calculateEMI(res.maxLoanAmount, 8.5, 240);
      assert.ok(Math.abs(checkEMI.monthlyEMI - 55000) <= 1.0);
    });

    it('returns 0 when existing EMIs exceed or equal FOIR capacity', () => {
      const res = calculateLoanEligibility(100000, 60000, 8.5, 240, 50);
      assert.equal(res.maxLoanAmount, 0);
      assert.equal(res.maxAvailableEMI, 0);
    });
  });

  describe('5. Credit Card Payoff & Negative Amortization', () => {
    it('calculates fixed payment interest savings over minimum-due trap', () => {
      // Balance 50k, 36% APR (3% mo), min due 5%, fixed payment 3,500/mo
      const res = calculateCreditCardPayoff(50000, 36, 5, 3500);
      assert.ok(res.minPlan.isPayoffPossible);
      assert.ok(res.fixedPlan.isPayoffPossible);
      assert.ok(res.savings.interestSaved > 0);
      assert.ok(res.savings.monthsSaved > 0);
      assert.ok(res.fixedPlan.months < res.minPlan.months);
    });

    it('detects negative amortization when payment is less than monthly interest', () => {
      // Balance 100k, 48% APR -> monthly interest is 4,000.
      // If user pays 2,000 fixed, debt will NEVER be paid off!
      const res = calculateCreditCardPayoff(100000, 48, 5, 2000);
      assert.equal(res.fixedPlan.isPayoffPossible, false);
      assert.equal(res.fixedPlan.months, Infinity);
      assert.equal(res.fixedPlan.totalPaid, Infinity);
      assert.equal(res.fixedPlan.totalInterest, Infinity);
      assert.equal(res.savings.interestSaved, 0);
    });

    it('handles zero balance safely', () => {
      const res = calculateCreditCardPayoff(0, 36, 5, 1000);
      assert.equal(res.minPlan.months, 0);
      assert.equal(res.fixedPlan.months, 0);
    });
  });

  describe('6. Savings & Deposit Calculators', () => {
    it('Compound Interest: computes future value and deposits', () => {
      const res = calculateCompoundInterest(100000, 10, 5, 'annually');
      // 100,000 * (1.10)^5 = 161,051
      assert.equal(res.futureValue, 161051);
      assert.equal(res.totalInterest, 61051);
      assert.equal(res.totalDeposits, 100000);
    });

    it('Simple Interest: computes accurate linear return', () => {
      const res = calculateSimpleInterest(50000, 8.0, 3);
      assert.equal(res.totalInterest, 12000);
      assert.equal(res.totalAmount, 62000);
    });

    it('Fixed Deposit: quarterly compounding standard (RBI/SBI rule)', () => {
      // 100k at 7.5% for 1 year quarterly = 100000 * (1 + 0.075/4)^4 = 107,713.59
      const res = calculateFixedDeposit(100000, 7.5, 12, 'quarterly');
      assert.equal(res.maturityAmount, 107713.59);
      assert.equal(res.totalInterest, 7713.59);
    });

    it('Fixed Deposit: supports numeric frequency override', () => {
      const res = calculateFixedDeposit(100000, 10, 12, 1); // Annual compounding
      assert.equal(res.maturityAmount, 110000);
    });

    it('Recurring Deposit: quarterly compounding standard', () => {
      const res = calculateRecurringDeposit(5000, 7.0, 12);
      assert.equal(res.totalInvested, 60000);
      assert.ok(res.maturityAmount > 62000);
    });

    it('PPF: computes 15-year tax-free government maturity', () => {
      const res = calculatePPF(150000, 15, 7.1);
      assert.equal(res.totalInvested, 2250000);
      assert.ok(res.maturityAmount > 4000000);
      assert.equal(res.yearlyBreakdown.length, 15);
    });

    it('Goal Savings: reverse-solves required monthly investment', () => {
      const res = calculateGoalSavings(1000000, 5, 12, 50000);
      assert.ok(res.monthlySavings > 0);
      assert.ok(res.totalDeposits < 1000000);
    });
  });

  describe('7. Investment & Wealth Calculators', () => {
    it('SIP: matches standard Indian mutual fund monthly annuity formula', () => {
      // 10,000/mo at 12% for 10 years
      const res = calculateSIP(10000, 12, 10);
      assert.equal(res.totalInvested, 1200000);
      // FV ~ 23.23 Lakhs
      assert.ok(res.futureValue >= 2300000 && res.futureValue <= 2350000);
      assert.equal(res.estimatedReturns, round2(res.futureValue - res.totalInvested));
    });

    it('Step-Up SIP: creates higher corpus than fixed SIP', () => {
      const fixed = calculateSIP(10000, 12, 10);
      const stepUp = calculateStepUpSIP(10000, 10, 12, 10);
      assert.ok(stepUp.futureValue > fixed.futureValue);
      assert.ok(stepUp.totalInvested > fixed.totalInvested);
    });

    it('CAGR: computes compound annual growth rate accurately', () => {
      // 100k grows to 200k in 5 years -> 14.87%
      const res = calculateCAGR(100000, 200000, 5);
      assert.equal(res.cagr, 14.87);
      assert.equal(res.totalReturnPercent, 100);
      assert.equal(res.isValid, true);
    });

    it('CAGR: protects against division by zero and invalid inputs', () => {
      const res = calculateCAGR(0, 100000, 5);
      assert.equal(res.isValid, false);
      assert.equal(res.cagr, 0);
    });

    it('Lump Sum: standard compound growth', () => {
      const res = calculateLumpSum(100000, 12, 10);
      // 100000 * 1.12^10 = 310,584.82
      assert.equal(res.futureValue, 310584.82);
      assert.equal(res.estimatedReturns, 210584.82);
    });

    it('Investment Returns: computes absolute and annualized return with dividends', () => {
      const res = calculateInvestmentReturns(100000, 150000, 10000, 2);
      assert.equal(res.netProfit, 60000);
      assert.equal(res.absoluteReturn, 60);
      assert.ok(res.annualizedReturn > 26);
    });
  });

  describe('8. Income Tax Engine (Budget 2025 FY 2025-26 & FY 2024-25)', () => {
    it('FY 2025-26 New Regime: Gross ₹12.75 Lakhs salaried pays ₹0 tax (₹75k std ded + S.87A rebate)', () => {
      const res = calculateIncomeTax(1275000, 0, 'new', 'FY_2025_26');
      assert.equal(res.newRegime.standardDeduction, 75000);
      assert.equal(res.newRegime.taxableIncome, 1200000);
      assert.equal(res.newRegime.slabTax, 60000);
      assert.equal(res.newRegime.rebate87A, 60000);
      assert.equal(res.newRegime.totalTax, 0);
      assert.equal(res.selectedTax, 0);
    });

    it('FY 2025-26 New Regime: Section 87A Marginal Relief applies when income exceeds ₹12 Lakhs taxable', () => {
      // Gross ₹12,85,000 salaried -> Taxable ₹12,10,000 (Excess ₹10,000 over ₹12L)
      // Slab tax = 4L*0% + 4L*5%(20k) + 4L*10%(40k) + 10k*15%(1500) = 61,500.
      // Proviso to Section 87A: Tax before cess cannot exceed excess income (₹10,000).
      // Marginal relief = 61,500 - 10,000 = ₹51,500.
      // Tax after relief = ₹10,000. Add 4% cess = ₹10,400.
      const res = calculateIncomeTax(1285000, 0, 'new', 'FY_2025_26');
      assert.equal(res.newRegime.taxableIncome, 1210000);
      assert.equal(res.newRegime.slabTax, 61500);
      assert.equal(res.newRegime.marginalRelief87A, 51500);
      assert.equal(res.newRegime.taxAfterRebate, 10000);
      assert.equal(res.newRegime.cess, 400);
      assert.equal(res.newRegime.totalTax, 10400);
    });

    it('FY 2025-26 New Regime: High income brackets and slabs', () => {
      // Gross ₹25 Lakhs salaried -> Taxable ₹24,25,000
      // 0-4L: 0
      // 4-8L: 20k
      // 8-12L: 40k
      // 12-16L: 60k
      // 16-20L: 80k
      // 20-24L: 100k
      // >24L (25k @ 30%): 7.5k
      // Total slab tax = 307,500. Cess = 12,300. Total = 319,800.
      const res = calculateIncomeTax(2500000, 0, 'new', 'FY_2025_26');
      assert.equal(res.newRegime.taxableIncome, 2425000);
      assert.equal(res.newRegime.slabTax, 307500);
      assert.equal(res.newRegime.cess, 12300);
      assert.equal(res.newRegime.totalTax, 319800);
    });

    it('FY 2024-25 New Regime: Gross ₹7.75 Lakhs salaried pays ₹0 tax', () => {
      const res = calculateIncomeTax(775000, 0, 'new', 'FY_2024_25');
      assert.equal(res.newRegime.standardDeduction, 75000);
      assert.equal(res.newRegime.taxableIncome, 700000);
      assert.equal(res.newRegime.totalTax, 0);
    });

    it('FY 2024-25 New Regime: Section 87A Marginal relief above ₹7 Lakhs taxable', () => {
      // Gross ₹7,85,000 -> Taxable ₹7,10,000. Excess = 10,000.
      // Slab tax = 20k + 1k = 21,000.
      // Relief = 21,000 - 10,000 = 11,000. Tax after relief = 10,000 + 4% cess = 10,400.
      const res = calculateIncomeTax(785000, 0, 'new', 'FY_2024_25');
      assert.equal(res.newRegime.taxableIncome, 710000);
      assert.equal(res.newRegime.slabTax, 21000);
      assert.equal(res.newRegime.marginalRelief87A, 11000);
      assert.equal(res.newRegime.totalTax, 10400);
    });

    it('Old Regime vs New Regime comparison recommends best option', () => {
      // Gross 15 Lakhs with 80C (1.5L), 80D (25k), Home loan int (2L) -> total ded = 375,000
      const res = calculateIncomeTax(1500000, 375000, 'new', 'FY_2025_26');
      assert.ok(res.newRegime.totalTax > 0);
      assert.ok(res.oldRegime.totalTax > 0);
      assert.ok(res.recommendedRegime === 'New Regime' || res.recommendedRegime === 'Old Regime');
      assert.ok(res.savingsWithRecommended >= 0);
    });
  });

  describe('9. Business & Salary Calculators', () => {
    it('GST: Add GST (exclusive) & Remove GST (inclusive)', () => {
      const addRes = calculateGST(10000, 18, 'add');
      assert.equal(addRes.netAmount, 10000);
      assert.equal(addRes.gstAmount, 1800);
      assert.equal(addRes.totalAmount, 11800);
      assert.equal(addRes.cgst, 900);
      assert.equal(addRes.sgst, 900);

      const remRes = calculateGST(11800, 18, 'remove');
      assert.equal(remRes.netAmount, 10000);
      assert.equal(remRes.gstAmount, 1800);
      assert.equal(remRes.totalAmount, 11800);
    });

    it('Take-Home Salary: calculates in-hand pay calibrated for ₹200k/month baseline', () => {
      const res = calculateTakeHomeSalary(2400000, 40, 20, 0, 'FY_2025_26');
      assert.equal(res.annualCTC, 2400000);
      assert.equal(res.monthlyGross, 200000);
      assert.ok(res.netMonthlySalary > 150000); // Net in-hand after PF, PT, and tax
      assert.equal(res.professionalTaxMonthly, 200);
    });

    it('Profit Margin & Markup: calculates unit and aggregate margins', () => {
      const res = calculateProfitMargin(60, 100, 50);
      assert.equal(res.profitPerUnit, 40);
      assert.equal(res.grossMarginPct, 40);
      assert.equal(res.markupPct, 66.67);
      assert.equal(res.totalRevenue, 5000);
      assert.equal(res.totalCost, 3000);
      assert.equal(res.totalProfit, 2000);
    });

    it('Break-Even Analysis: computes break-even volume and revenue', () => {
      const res = calculateBreakEven(100000, 40, 100);
      assert.equal(res.contributionMargin, 60);
      assert.equal(res.breakEvenUnits, 1667); // ceil(100000 / 60)
      assert.equal(res.breakEvenRevenue, 166700);
    });
  });

  describe('10. Personal Finance, Budget & Planning', () => {
    it('Net Worth: aggregates assets and liabilities correctly', () => {
      const assets = { cash: 100000, realEstate: 5000000, investments: 1500000, retirement: 800000, vehicles: 400000 };
      const liab = { mortgage: 2500000, autoLoans: 200000, creditCards: 50000 };
      const res = calculateNetWorth(assets, liab);
      assert.equal(res.totalAssets, 7800000);
      assert.equal(res.totalLiabilities, 2750000);
      assert.equal(res.netWorth, 5050000);
      assert.equal(res.liquidAssets, 1600000);
    });

    it('50/30/20 Budget: handles custom or 0 percentage allocations without bug', () => {
      const standard = calculateBudget50_30_20(100000);
      assert.equal(standard.needsAmount, 50000);
      assert.equal(standard.wantsAmount, 30000);
      assert.equal(standard.savingsAmount, 20000);

      const customZero = calculateBudget50_30_20(100000, 0, 40, 60);
      assert.equal(customZero.needsAmount, 0);
      assert.equal(customZero.wantsAmount, 40000);
      assert.equal(customZero.savingsAmount, 60000);
    });

    it('Buy vs Rent: supports both options object and positional arguments', () => {
      const objCall = calculateBuyVsRent({
        homePrice: 5000000,
        downPaymentPct: 20,
        mortgageRate: 8.5,
        mortgageYears: 20,
        monthlyRent: 25000,
        horizonYears: 10
      });
      const posCall = calculateBuyVsRent(5000000, 20, 8.5, 20, 4.0, 25000, 3.5, 9.0, 10);
      assert.equal(objCall.initialDownPayment, posCall.initialDownPayment);
      assert.equal(objCall.monthlyMortgage, posCall.monthlyMortgage);
      assert.ok(objCall.trajectory.length === 10);
      assert.ok(objCall.winner === 'Buying' || objCall.winner === 'Renting');
    });

    it('Inflation: calculates purchasing power loss and future replacement cost', () => {
      const res = calculateInflation(100000, 6.0, 10);
      assert.equal(res.initialAmount, 100000);
      assert.equal(res.adjustedAmount, 179084.77); // 100000 * 1.06^10
      assert.equal(res.yearlyBreakdown.length, 10);
    });

    it('FIRE Calculator: computes lean, standard, fat, and coast FIRE targets', () => {
      const res = calculateFIRE(30, 45, 1500000, 75000, 6.0, 11.0, 4.0);
      assert.ok(res.fireTarget > 0);
      assert.equal(res.leanFireTarget, round2(res.fireTarget * 0.75));
      assert.equal(res.fatFireTarget, round2(res.fireTarget * 1.30));
      assert.equal(res.yearsToRetirement, 15);
      assert.ok(res.monthlySavingsRequired >= 0);
    });
  });

  describe('11. Portfolio Builder Math Engine', () => {
    it('computes portfolio balance sheet and solvency metrics accurately', () => {
      const state = getDefaultPortfolioState();
      state.assets.cashChecking = '50000';
      state.assets.savingsAccounts = '150000';
      state.assets.stocksEquities = '800000';
      state.assets.mutualFundsETFs = '600000';
      state.assets.primaryResidence = '6000000';
      state.liabilities.mortgagePrimary = '3000000';
      state.income.primarySalary = '180000';
      state.expenses.fixedLiving = '60000';
      state.expenses.debtPayments = '35000';

      const metrics = calculatePortfolioMetrics(state);
      assert.equal(metrics.totalAssets, 7600000);
      assert.equal(metrics.totalLiabilities, 3000000);
      assert.equal(metrics.netWorth, 4600000);
      assert.equal(metrics.liquidAssets, 200000);
      assert.equal(metrics.marketInvestments, 1400000);
      assert.equal(metrics.totalMonthlyIncome, 180000);
      assert.equal(metrics.monthlyNetSurplus, 85000); // 180k - 60k - 35k
      assert.ok(metrics.debtToAssetRatio < 50);
    });
  });
});
