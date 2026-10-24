/**
 * Client-Side SEO & Meta Coordinator
 * Dynamically updates document.title, description, and canonical link during SPA transitions.
 */

export const ROUTE_METADATA = {
  // 1. Loans & Mortgages
  'emi': {
    title: 'EMI Calculator — Loan EMI & Amortization | Finculator',
    description: 'Calculate monthly loan EMI, total interest payable, and full amortization schedules for home, car, and personal loans with institutional precision.',
    canonical: 'https://finculator.app/emi-calculator'
  },
  'prepayment': {
    title: 'Loan Prepayment Analyzer — Pay Off Debt Faster | Finculator',
    description: 'Calculate how extra principal prepayments or lump-sum contributions reduce total loan tenure and save interest on mortgages and personal loans.',
    canonical: 'https://finculator.app/prepayment-analyzer'
  },
  'comparator': {
    title: 'Loan Comparator — Compare Interest Rates & EMIs | Finculator',
    description: 'Compare multiple loan offers side by side across interest rates, tenures, processing fees, and lifetime borrowing costs.',
    canonical: 'https://finculator.app/loan-comparator'
  },
  'eligibility': {
    title: 'Loan Eligibility & FOIR Calculator | Finculator',
    description: 'Estimate your maximum borrowing capacity based on monthly in-hand income, fixed obligations, FOIR thresholds, and prevailing interest rates.',
    canonical: 'https://finculator.app/loan-eligibility-calculator'
  },
  'credit-card': {
    title: 'Credit Card Payoff Calculator — Debt Reduction | Finculator',
    description: 'Calculate payoff timelines, total finance charges, and interest savings on credit card balances with minimum payment and negative amortization detection.',
    canonical: 'https://finculator.app/credit-card-payoff-calculator'
  },

  // 2. Savings & Deposits
  'savings-compound': {
    title: 'Compound Interest Calculator — Future Value Growth | Finculator',
    description: 'Model compounding interest growth with custom compounding frequencies (daily, monthly, quarterly, annual) and regular monthly deposits.',
    canonical: 'https://finculator.app/compound-interest-calculator'
  },
  'savings-simple': {
    title: 'Simple Interest Calculator — Short-Term Yields | Finculator',
    description: 'Compute linear simple interest earnings, principal accumulation, and annualized return for bonds, promissory notes, and short-term debt.',
    canonical: 'https://finculator.app/simple-interest-calculator'
  },
  'savings-fd': {
    title: 'Fixed Deposit (FD) Calculator — Maturity Value | Finculator',
    description: 'Calculate fixed deposit maturity values and quarterly compounded interest yields across Indian bank and NBFC tenures.',
    canonical: 'https://finculator.app/fixed-deposit-calculator'
  },
  'savings-rd': {
    title: 'Recurring Deposit (RD) Calculator — Monthly Savings | Finculator',
    description: 'Calculate maturity corpus and quarterly compounded interest returns for monthly recurring deposits with Indian banks.',
    canonical: 'https://finculator.app/recurring-deposit-calculator'
  },
  'savings-savings': {
    title: 'Savings Account Interest Calculator | Finculator',
    description: 'Calculate daily balance interest accrual and tax deductions under Section 80TTA/80TTB for high-yield savings accounts.',
    canonical: 'https://finculator.app/savings-account-calculator'
  },

  // 3. Wealth & Investing
  'invest-sip': {
    title: 'SIP Calculator — Systematic Investment Plan Growth | Finculator',
    description: 'Calculate mutual fund wealth accumulation, total capital invested, and expected capital gains via monthly systematic investment plans.',
    canonical: 'https://finculator.app/sip-calculator'
  },
  'invest-step-up': {
    title: 'Step-Up SIP Calculator — Annual Increment Investing | Finculator',
    description: 'Model the compounding impact of boosting your monthly SIP contributions annually by a fixed percentage or fixed amount.',
    canonical: 'https://finculator.app/step-up-sip-calculator'
  },
  'invest-lumpsum': {
    title: 'Lumpsum Investment Calculator — Mutual Fund Wealth | Finculator',
    description: 'Calculate the long-term compounding maturity value of one-time lump-sum investments in equity, index funds, and debt securities.',
    canonical: 'https://finculator.app/lumpsum-calculator'
  },
  'invest-cagr': {
    title: 'CAGR Calculator — Compound Annual Growth Rate | Finculator',
    description: 'Calculate true Compound Annual Growth Rate (CAGR) and absolute percentage returns for mutual funds, stocks, and real estate assets.',
    canonical: 'https://finculator.app/cagr-calculator'
  },
  'invest-ppf': {
    title: 'PPF Calculator — Public Provident Fund Scheme | Finculator',
    description: 'Calculate sovereign-backed 15-year Public Provident Fund (PPF) maturity returns, interest accruals, and Section 80C EEE tax exemptions.',
    canonical: 'https://finculator.app/ppf-calculator'
  },
  'invest-epf': {
    title: 'EPF Calculator — Employees Provident Fund Corpus | Finculator',
    description: 'Model your EPF retirement corpus based on basic salary, annual increments, statutory employer-employee contributions, and EPFO interest.',
    canonical: 'https://finculator.app/epf-calculator'
  },
  'invest-nps': {
    title: 'NPS Calculator — National Pension System Corpus | Finculator',
    description: 'Calculate your retirement corpus, lumpsum withdrawal amount, and expected monthly pension annuity under the National Pension System (NPS).',
    canonical: 'https://finculator.app/nps-calculator'
  },
  'invest-mutual-funds': {
    title: 'Mutual Fund Returns & Expense Calculator | Finculator',
    description: 'Analyze net mutual fund returns after accounting for expense ratio drag, exit loads, and market volatility.',
    canonical: 'https://finculator.app/mutual-fund-calculator'
  },
  'invest-stock': {
    title: 'Stock Return & Dividend Yield Calculator | Finculator',
    description: 'Calculate total shareholder return, capital appreciation, dividend reinvestment yields, and annualized stock performance.',
    canonical: 'https://finculator.app/stock-return-calculator'
  },

  // 4. Tax & Business
  'tax-income': {
    title: 'Income Tax Calculator (FY 2025-26 & FY 2024-25) | Finculator',
    description: 'Accurately compute tax liability under Union Budget 2025 new tax slabs, ₹75,000 standard deduction, Section 87A rebate, and marginal relief.',
    canonical: 'https://finculator.app/income-tax-calculator'
  },
  'tax-salary': {
    title: 'Take-Home Salary Calculator — In-Hand Pay Breakdown | Finculator',
    description: 'Convert annual CTC to true monthly in-hand net salary after deducting EPF, professional tax, and income tax withholdings.',
    canonical: 'https://finculator.app/salary-calculator'
  },
  'tax-capital-gains': {
    title: 'Capital Gains Tax Calculator — STCG & LTCG Rates | Finculator',
    description: 'Calculate short-term and long-term capital gains tax on equity (12.5% LTCG over ₹1.25L, 20% STCG) and real estate under current tax laws.',
    canonical: 'https://finculator.app/capital-gains-tax-calculator'
  },
  'tax-hra': {
    title: 'HRA Exemption Calculator — House Rent Allowance | Finculator',
    description: 'Calculate eligible Section 10(13A) House Rent Allowance tax exemptions based on actual rent paid, basic salary, and metro classification.',
    canonical: 'https://finculator.app/hra-calculator'
  },
  'tax-gst': {
    title: 'GST Calculator — Inclusive & Exclusive Rates | Finculator',
    description: 'Compute forward and reverse Goods and Services Tax (GST) amounts for standard rate slabs (5%, 12%, 18%, 28%) with CGST and SGST splits.',
    canonical: 'https://finculator.app/gst-calculator'
  },

  // 5. Long-Term Planning
  'fire': {
    title: 'FIRE Calculator — Financial Independence, Retire Early | Finculator',
    description: 'Calculate your target financial independence retirement number, safe withdrawal rate (SWR), savings rate, and exact retirement timeline.',
    canonical: 'https://finculator.app/fire-calculator'
  },
  'inflation': {
    title: 'Inflation Calculator — Future Cost of Living | Finculator',
    description: 'Calculate the purchasing power erosion of cash and estimate the future nominal cost of education, healthcare, and living expenses.',
    canonical: 'https://finculator.app/inflation-calculator'
  },
  'net-worth': {
    title: 'Net Worth Calculator — Assets & Liabilities Tracker | Finculator',
    description: 'Calculate your true balance sheet net worth by auditing liquid investments, illiquid assets, real estate, and short/long term debt obligations.',
    canonical: 'https://finculator.app/net-worth-calculator'
  },
  'budget': {
    title: '50/30/20 Budget Planner — Income Allocation Model | Finculator',
    description: 'Organize after-tax income into Needs (50%), Wants (30%), and Savings/Investments (20%) with customizable category allocations.',
    canonical: 'https://finculator.app/budget-planner'
  },
  'buy-vs-rent': {
    title: 'Buy vs Rent Calculator — Real Estate Decision Engine | Finculator',
    description: 'Analyze the mathematical comparison between buying a home vs renting and investing down payment surplus with symmetric cash flow opportunity cost.',
    canonical: 'https://finculator.app/buy-vs-rent-calculator'
  },

  // Core Pages
  'about': {
    title: 'About Finculator — Zero-Defect Private Financial Engineering',
    description: 'Finculator is an independent, zero-latency financial engineering platform built with strict client-side privacy and institutional precision.',
    canonical: 'https://finculator.app/about'
  }
};

/**
 * Updates DOM title, meta description, and canonical link
 */
export function updatePageSEO(route) {
  const meta = ROUTE_METADATA[route] || ROUTE_METADATA['emi'];
  if (!meta) return;

  document.title = meta.title;

  let descTag = document.querySelector('meta[name="description"]');
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', meta.description);

  let canonicalTag = document.querySelector('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalTag);
  }
  canonicalTag.setAttribute('href', meta.canonical);
}
