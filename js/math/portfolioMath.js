/**
 * Finculator Portfolio Math Engine & Data Schema
 * Computes Balance Sheet, Cash Flow, Asset Allocation, and Solvency Metrics
 */

export const DEFAULT_PORTFOLIO_STATE = {
  profile: {
    fullName: '',
    dob: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    employer: '',
    maritalStatus: '',
    dependents: '',
    asOfDate: new Date().toISOString().split('T')[0],
    currency: 'INR'
  },
  assets: {
    // Liquid Assets
    cashChecking: '',
    savingsAccounts: '',
    moneyMarket: '',
    // Fixed Deposits / CDs
    fixedDeposits: '',
    recurringDeposits: '',
    // Investment Holdings
    stocksEquities: '',
    mutualFundsETFs: '',
    bondsFixedIncome: '',
    retirementAccounts: '', // EPF, PPF, NPS
    // Real Estate
    primaryResidence: '',
    investmentProperties: '',
    // Vehicles & Personal Valuables
    vehicles: '',
    valuablesArtJewelry: '',
    // Business & Receivables
    businessEquity: '',
    lifeInsuranceCashValue: '',
    receivables: ''
  },
  liabilities: {
    creditCards: '',
    mortgagePrimary: '',
    mortgageInvestment: '',
    autoLoans: '',
    studentLoans: '',
    personalLoans: '',
    linesOfCredit: '',
    unpaidTaxes: '',
    otherDebts: ''
  },
  income: {
    primarySalary: '', // Monthly
    secondarySalary: '',
    businessIncome: '',
    rentalIncome: '',
    dividendsInterest: '',
    otherIncome: ''
  },
  expenses: {
    fixedLiving: '', // Monthly (Rent/EMI, utilities, insurance)
    variableDiscretionary: '', // Dining, leisure, shopping
    debtPayments: '' // Monthly EMIs
  },
  allocation: {
    equityPct: '',
    fixedIncomePct: '',
    cashPct: '',
    realEstatePct: '',
    goldCommoditiesPct: '',
    alternativesPct: ''
  },
  holdings: [],
  insurance: {
    lifeType: '',
    lifeCoverage: '',
    lifePremium: '',
    healthCoverage: '',
    healthPremium: '',
    otherCoverageNotes: ''
  },
  goals: [],
  estate: {
    willStatus: '',
    namedBeneficiaries: '',
    powerOfAttorney: ''
  },
  credit: {
    creditScore: '',
    scoreSource: ''
  }
};

/**
 * Calculate comprehensive Portfolio Financial Metrics
 * @param {typeof DEFAULT_PORTFOLIO_STATE} state 
 */
export function calculatePortfolioMetrics(state) {
  const assets = state.assets || {};
  const liab = state.liabilities || {};
  const inc = state.income || {};
  const exp = state.expenses || {};
  const holdings = state.holdings || [];

  // 1. Assets Aggregation
  const liquidAssets = (Number(assets.cashChecking) || 0) +
                       (Number(assets.savingsAccounts) || 0) +
                       (Number(assets.moneyMarket) || 0);

  const fixedDepositAssets = (Number(assets.fixedDeposits) || 0) +
                             (Number(assets.recurringDeposits) || 0);

  const marketInvestments = (Number(assets.stocksEquities) || 0) +
                            (Number(assets.mutualFundsETFs) || 0) +
                            (Number(assets.bondsFixedIncome) || 0);

  const retirementAssets = Number(assets.retirementAccounts) || 0;

  const realEstateAssets = (Number(assets.primaryResidence) || 0) +
                           (Number(assets.investmentProperties) || 0);

  const vehicleAssets = Number(assets.vehicles) || 0;
  const valuableAssets = Number(assets.valuablesArtJewelry) || 0;
  const otherAssets = (Number(assets.businessEquity) || 0) +
                      (Number(assets.lifeInsuranceCashValue) || 0) +
                      (Number(assets.receivables) || 0);

  const totalAssets = liquidAssets + fixedDepositAssets + marketInvestments + retirementAssets +
                      realEstateAssets + vehicleAssets + valuableAssets + otherAssets;

  // 2. Liabilities Aggregation
  const shortTermLiabilities = (Number(liab.creditCards) || 0) +
                               (Number(liab.unpaidTaxes) || 0) +
                               (Number(liab.linesOfCredit) || 0);

  const longTermLiabilities = (Number(liab.mortgagePrimary) || 0) +
                              (Number(liab.mortgageInvestment) || 0) +
                              (Number(liab.autoLoans) || 0) +
                              (Number(liab.studentLoans) || 0) +
                              (Number(liab.personalLoans) || 0) +
                              (Number(liab.otherDebts) || 0);

  const totalLiabilities = shortTermLiabilities + longTermLiabilities;

  // 3. Net Worth & Solvency
  const netWorth = totalAssets - totalLiabilities;
  const liquidNetWorth = (liquidAssets + fixedDepositAssets + marketInvestments) - shortTermLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? Number(((totalLiabilities / totalAssets) * 100).toFixed(1)) : 0;

  // 4. Monthly Cash Flow & Ratios
  const totalMonthlyIncome = (Number(inc.primarySalary) || 0) +
                             (Number(inc.secondarySalary) || 0) +
                             (Number(inc.businessIncome) || 0) +
                             (Number(inc.rentalIncome) || 0) +
                             (Number(inc.dividendsInterest) || 0) +
                             (Number(inc.otherIncome) || 0);

  const totalMonthlyExpenses = (Number(exp.fixedLiving) || 0) +
                               (Number(exp.variableDiscretionary) || 0) +
                               (Number(exp.debtPayments) || 0);

  const monthlyNetSurplus = totalMonthlyIncome - totalMonthlyExpenses;
  const savingsRatePct = totalMonthlyIncome > 0 ? Number(((monthlyNetSurplus / totalMonthlyIncome) * 100).toFixed(1)) : 0;
  const debtToIncomeRatio = totalMonthlyIncome > 0 ? Number((((Number(exp.debtPayments) || 0) / totalMonthlyIncome) * 100).toFixed(1)) : 0;

  // Emergency Fund Runway (Months of survival with zero income)
  const monthlyLivingBurn = (Number(exp.fixedLiving) || 0) + (Number(exp.debtPayments) || 0);
  const emergencyRunwayMonths = monthlyLivingBurn > 0 ? Number((liquidAssets / monthlyLivingBurn).toFixed(1)) : 0;
  const emergencyRecommended = monthlyLivingBurn * 6; // 6 months standard benchmark
  const emergencyFundProgressPct = emergencyRecommended > 0 ? Math.min(100, Math.round((liquidAssets / emergencyRecommended) * 100)) : 100;

  // 5. Holdings Ledger Valuation
  let totalHoldingsCost = 0;
  let totalHoldingsValue = 0;
  const processedHoldings = holdings.map((h) => {
    const qty = Number(h.qty) || 0;
    const buyPrice = Number(h.buyPrice) || 0;
    const curPrice = Number(h.currentPrice) || 0;
    const cost = qty * buyPrice;
    const val = qty * curPrice;
    const gainLoss = val - cost;
    const gainLossPct = cost > 0 ? Number(((gainLoss / cost) * 100).toFixed(2)) : 0;

    totalHoldingsCost += cost;
    totalHoldingsValue += val;

    return {
      ...h,
      cost,
      value: val,
      gainLoss,
      gainLossPct
    };
  });

  // Calculate weights for processed holdings
  processedHoldings.forEach((h) => {
    h.weightPct = totalHoldingsValue > 0 ? Number(((h.value / totalHoldingsValue) * 100).toFixed(1)) : 0;
  });

  const totalHoldingsGainLoss = totalHoldingsValue - totalHoldingsCost;
  const totalHoldingsGainLossPct = totalHoldingsCost > 0 ? Number(((totalHoldingsGainLoss / totalHoldingsCost) * 100).toFixed(2)) : 0;

  // 6. Asset Class Allocation Donut Data
  const totalInvestments = (marketInvestments + fixedDepositAssets + retirementAssets + otherAssets) || 1;
  const allocationSegments = [
    { label: 'Equity & Stocks', value: marketInvestments * 0.65, colorClass: 'principal' },
    { label: 'Fixed Income & Bonds', value: (fixedDepositAssets + (marketInvestments * 0.2)), colorClass: 'interest' },
    { label: 'Retirement (PF/PPF/NPS)', value: retirementAssets, colorClass: 'extra' },
    { label: 'Liquid Cash & Savings', value: liquidAssets, colorClass: 'principal' },
    { label: 'Real Estate Equity', value: realEstateAssets, colorClass: 'interest' },
    { label: 'Gold & Valuables', value: valuableAssets, colorClass: 'extra' }
  ];

  // Recalculate segment percentages
  const grandAssetBase = totalAssets || 1;
  const assetCategoryBreakdown = [
    { label: 'Liquid Cash & Bank', value: liquidAssets, percent: Math.round((liquidAssets / grandAssetBase) * 100) },
    { label: 'Fixed Deposits & Term', value: fixedDepositAssets, percent: Math.round((fixedDepositAssets / grandAssetBase) * 100) },
    { label: 'Market Investments', value: marketInvestments, percent: Math.round((marketInvestments / grandAssetBase) * 100) },
    { label: 'Retirement Accounts', value: retirementAssets, percent: Math.round((retirementAssets / grandAssetBase) * 100) },
    { label: 'Real Estate Holdings', value: realEstateAssets, percent: Math.round((realEstateAssets / grandAssetBase) * 100) },
    { label: 'Vehicles & Valuables', value: vehicleAssets + valuableAssets, percent: Math.round(((vehicleAssets + valuableAssets) / grandAssetBase) * 100) },
    { label: 'Business & Others', value: otherAssets, percent: Math.round((otherAssets / grandAssetBase) * 100) }
  ];

  return {
    liquidAssets,
    fixedDepositAssets,
    marketInvestments,
    retirementAssets,
    realEstateAssets,
    vehicleAssets,
    valuableAssets,
    otherAssets,
    totalAssets,
    shortTermLiabilities,
    longTermLiabilities,
    totalLiabilities,
    netWorth,
    liquidNetWorth,
    debtToAssetRatio,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlyNetSurplus,
    savingsRatePct,
    debtToIncomeRatio,
    emergencyRunwayMonths,
    emergencyRecommended,
    emergencyFundProgressPct,
    processedHoldings,
    totalHoldingsCost,
    totalHoldingsValue,
    totalHoldingsGainLoss,
    totalHoldingsGainLossPct,
    assetCategoryBreakdown
  };
}
