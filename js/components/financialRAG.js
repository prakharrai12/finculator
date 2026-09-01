/**
 * Finculator Financial RAG (Retrieval-Augmented Generation) Knowledge Engine
 * Comprehensive institutional knowledge base covering all financial domains,
 * formulas, options, Indian tax laws, loan underwriting, and dynamic parameter parsing.
 */

import { calculateEMI, calculateSIP, calculateLumpSum } from '../math/financeMath.js';
import { formatCurrency } from '../utils/formatters.js';

export const FINANCIAL_KNOWLEDGE_BASE = [
  {
    id: 'tax_old_vs_new',
    title: 'Income Tax: Old vs New Regime Comparison',
    route: 'tax-income',
    actionLabel: 'Open Income Tax Calculator',
    keywords: ['tax', 'regime', 'old', 'new', '80c', '80d', 'hra', 'deduction', 'standard deduction', 'cess', 'slab', '24l', '24 lakh', '200k', 'which regime'],
    summary: 'Comprehensive analysis of Old vs New Tax Regime under Indian Finance Act.',
    answer: `**Old vs. New Tax Regime Guidance:**
• **New Tax Regime (Default):** Features lower, concessional tax slab rates and an increased **Standard Deduction of ₹75,000** (for salaried employees). Traditional exemptions (Section 80C, 80D, HRA) are not applicable.
• **Old Tax Regime:** Allows claiming Section 80C (up to ₹1.5L), Section 80D (health insurance up to ₹25k-₹50k), HRA, and home loan interest (Section 24b up to ₹2L), with a ₹50,000 standard deduction.

**For a ₹24 Lakhs/yr (₹200k/month) Salary Earner:**
• The **New Regime is usually optimal** unless your total deductions exceed **₹3.75 to ₹4.0 Lakhs**.
• You can test your exact exemptions side-by-side in our calculator:`
  },
  {
    id: 'take_home_salary',
    title: 'Take-Home / In-Hand Paycheck Computation',
    route: 'tax-salary',
    actionLabel: 'Open Take-Home Salary Calculator',
    keywords: ['salary', 'take home', 'in hand', 'ctc', 'paycheck', 'gross', 'net', 'epf', 'pf', 'professional tax', 'monthly in hand'],
    summary: 'Breaks down Annual CTC into monthly gross, EPF deductions, TDS withholdings, and net in-hand pay.',
    answer: `**Take-Home Salary Breakdown:**
• **Cost to Company (CTC)** includes Basic Salary, HRA, Special Allowances, and employer EPF contributions.
• **Deductions:**
  1. Employee EPF: **12% of Basic Salary** (typically ₹10,000–₹12,000/mo on ₹24L CTC).
  2. Professional Tax: **₹200/month** (₹2,500/year).
  3. Income Tax TDS: Withheld monthly according to your tax regime.

**For a ₹24 Lakhs CTC (₹2,00,000 / month gross):**
• Your estimated net in-hand salary is approximately **₹1,60,000 to ₹1,63,000 / month** under the New Tax Regime.`
  },
  {
    id: 'loan_prepayment',
    title: 'Home Loan Prepayment & Tenure Reduction',
    route: 'prepayment',
    actionLabel: 'Open Prepayment Analyzer',
    keywords: ['prepay', 'prepayment', 'part payment', 'extra emi', 'tenure reduction', 'cut loan', 'save interest', 'foreclose'],
    summary: 'Analyzes how extra monthly, annual, or lump-sum prepayments cut years off mortgage amortization.',
    answer: `**How Loan Prepayment Saves Massive Interest:**
• Early in a 20-year mortgage, **over 70% of each EMI goes toward interest**, not principal.
• Any prepayment you make is **subtracted 100% directly from your outstanding principal**.
• **Power Moves:**
  1. **Paying 1 Extra EMI per year** can cut a 20-year home loan by **3 to 4 years** and save **₹8 Lakhs to ₹12 Lakhs** in interest!
  2. Increasing your EMI by just **5% annually** cuts your repayment tenure nearly in half.`
  },
  {
    id: 'loan_eligibility_foir',
    title: 'Borrowing Capacity & FOIR Underwriting Rules',
    route: 'eligibility',
    actionLabel: 'Open Loan Eligibility Calculator',
    keywords: ['eligibility', 'foir', 'how much loan', 'borrow', 'borrowing power', 'dti', 'debt to income', 'eligible', 'home loan capacity'],
    summary: 'Determines maximum permissible loan eligibility using banking FOIR thresholds.',
    answer: `**How Banks Calculate Your Loan Eligibility (FOIR):**
• **FOIR (Fixed Obligation to Income Ratio):** Indian banks cap your total monthly debt payments (existing loans + new EMI) at **50% of your net monthly income**.
• **Formula:** \`Max Allowable EMI = (Monthly Income × 50%) − Existing EMIs\`

**For a ₹200k/month Salary Earner:**
• Total permissible EMI capacity = **₹1,00,000 / month**.
• With ₹20,000 existing obligations, your available EMI is **₹80,000 / month**.
• At 8.5% interest for 20 years, you qualify for a loan of **₹92 Lakhs to ₹1.1 Crore**!`
  },
  {
    id: 'emi_loan_repayment',
    title: 'EMI & Reducing Balance Amortization',
    route: 'emi',
    actionLabel: 'Open EMI & Repayment Calculator',
    keywords: ['emi', 'loan', 'mortgage', 'repayment', 'amortization', 'schedule', 'interest rate', 'tenure', '50 lakh'],
    summary: 'Calculates equated monthly installments and step-down principal reduction schedules.',
    answer: `**EMI Calculation Formula:**
• \`E = P × r × (1+r)^n / ((1+r)^n - 1)\`
• For a **₹50 Lakhs Home Loan** at 8.5% annual interest over a 20-year tenure (240 months):
  - **Monthly EMI:** **₹43,391**
  - **Total Interest Paid:** **₹54,13,879**
  - **Total Lifetime Repayment:** **₹1,04,13,879**
• You can review the full year-by-year amortization step-down in our tool:`
  },
  {
    id: 'loan_comparator',
    title: 'Multi-Scenario Loan Offer Comparator',
    route: 'comparator',
    actionLabel: 'Open Loan Comparator',
    keywords: ['compare', 'comparator', 'two loans', '3 loans', 'loan offers', '15 vs 20', 'which bank', 'hdfc vs sbi'],
    summary: 'Compares up to 3 loan offers side-by-side with interest liability and lifetime cost analysis.',
    answer: `**Comparing Loan Offers Effectively:**
• A lower interest rate with a longer tenure often results in **much higher total interest** than a slightly higher rate with a shorter tenure.
• Always compare:
  1. **Total Interest Liability** over the full duration.
  2. **Upfront Processing Fees** (0.25% to 1.0%).
  3. **Break-Even Period** if opting for a concession rate with higher processing charges.`
  },
  {
    id: 'credit_card_trap',
    title: 'Credit Card Minimum-Due Debt Trap',
    route: 'credit-card',
    actionLabel: 'Open Credit Card Calculator',
    keywords: ['credit card', 'minimum due', 'card debt', 'debt trap', 'apr', 'finance charge', 'revolving credit'],
    summary: 'Reveals how paying only 5% minimum due leads to runaway compound interest at 36%-42% APR.',
    answer: `**The Credit Card Minimum Due Trap:**
• Banks set the Minimum Amount Due at only **5% of the total balance**.
• However, interest accumulates at **36% to 42% APR** compounded daily on the unpaid remainder!
• **Example:** Paying only the minimum due on a ₹50,000 balance takes over **14 years to clear** and costs over **₹85,000 in interest alone**!
• Switching to a fixed monthly payoff of ₹3,000 clears the entire balance in under 2 years.`
  },
  {
    id: 'sip_systematic_plan',
    title: 'SIP (Systematic Investment Plan) Compounding',
    route: 'invest-sip',
    actionLabel: 'Open SIP Calculator',
    keywords: ['sip', 'mutual fund', 'invest monthly', 'recurring invest', 'nifty', 'rupee cost averaging', '25k', '25000'],
    summary: 'Models wealth creation via monthly systematic mutual fund investments.',
    answer: `**Power of Systematic Investment Plans (SIP):**
• SIP applies **Rupee-Cost Averaging**, buying more mutual fund units when the market drops and fewer when it peaks.
• **Wealth Accumulation on ₹25,000 / Month (@ 12% CAGR):**
  - **In 5 Years:** Invested ₹15 Lakhs → Grows to **₹20.6 Lakhs**
  - **In 10 Years:** Invested ₹30 Lakhs → Grows to **₹58.1 Lakhs**
  - **In 15 Years:** Invested ₹45 Lakhs → Grows to **₹1.26 Crore**!
  - Over 15 years, **compound gains (₹81 Lakhs)** exceed your actual invested capital by nearly 2x!`
  },
  {
    id: 'step_up_sip',
    title: 'Step-Up SIP (Annual Contribution Hike)',
    route: 'invest-stepup',
    actionLabel: 'Open Step-Up SIP Calculator',
    keywords: ['step up', 'step-up', 'increase sip', 'annual increment', 'salary hike sip', 'boost investment'],
    summary: 'Simulates annual percentage increases in monthly SIP to match professional salary increments.',
    answer: `**Why You Should Use a Step-Up SIP:**
• As your salary grows each year, your monthly investment should too.
• If you start at **₹25,000 / month** and increase your SIP by **10% every year** at 12% returns:
  - After 15 years, your portfolio reaches **₹2.05 Crore**!
  - That is **nearly ₹80 Lakhs more** than a flat SIP!`
  },
  {
    id: 'lump_sum_compound',
    title: 'Lump Sum & Exponential Compound Interest',
    route: 'savings-compound',
    actionLabel: 'Open Compound Interest Suite',
    keywords: ['compound interest', 'lump sum', 'compounding frequency', 'daily compounding', 'quarterly', 'formula'],
    summary: 'Calculates exponential compound interest across Daily, Monthly, Quarterly, and Annual frequencies.',
    answer: `**Exponential Compound Interest Math:**
• \`A = P × (1 + r/n)^(nt)\`
• Under the **Rule of 72**, dividing 72 by your expected annual return tells you how fast your money doubles:
  - At **12% return**, your money doubles every **6 years** (72 / 12 = 6).
  - A one-time lump sum of **₹5 Lakhs** grows to **₹20 Lakhs in 12 years**!`
  },
  {
    id: 'ppf_provident_fund',
    title: 'Public Provident Fund (PPF) - Triple Tax Exemption',
    route: 'savings-ppf',
    actionLabel: 'Open PPF Calculator',
    keywords: ['ppf', 'provident fund', 'tax free', 'eee', '15 years', 'sovereign', 'safe investment'],
    summary: 'Computes 15-year guaranteed sovereign returns with complete EEE tax-exempt status.',
    answer: `**Public Provident Fund (PPF) Superpowers:**
• **Status: EEE (Exempt-Exempt-Exempt)**
  1. Deposit is tax-deductible under Section 80C (up to ₹1.5 Lakhs/year).
  2. Interest earned is completely tax-free.
  3. Maturity proceeds are 100% tax-free!
• Maxing out ₹1.5 Lakhs every year for 15 years yields **over ₹40 Lakhs completely tax-free**!`
  },
  {
    id: 'fire_retirement_corpus',
    title: 'FIRE Movement & Retirement Corpus Targets',
    route: 'fire',
    actionLabel: 'Open Retirement & FIRE Engine',
    keywords: ['fire', 'retirement', 'financial independence', 'corpus', 'safe withdrawal', 'swr', '4 percent', 'retire early', 'freedom'],
    summary: 'Calculates Lean, Standard, and Fat FIRE milestones based on annual expenses and Safe Withdrawal Rates.',
    answer: `**FIRE (Financial Independence, Retire Early) Calculation:**
• **The 25x–30x Rule:** Your target retirement corpus is determined by your annual living expenses divided by your **Safe Withdrawal Rate (SWR)**:
  - \`FIRE Corpus = Annual Living Expenses × 25\` (based on a 4.0% SWR).
  - In India with higher inflation, a **3.3%–3.5% SWR (30x expenses)** is recommended.

**Example for ₹80,000/month (₹9.6 Lakhs/year) Living Expenses:**
• **Standard FIRE Target:** **₹2.88 Crore to ₹3.0 Crore**.
• **Lean FIRE (75% expenses):** **₹2.16 Crore**.`
  },
  {
    id: 'budget_50_30_20',
    title: 'The 50/30/20 Budgeting Rule',
    route: 'budget',
    actionLabel: 'Open 50/30/20 Budget Planner',
    keywords: ['budget', '50/30/20', 'needs', 'wants', 'savings', 'cash flow', 'spending', 'money management'],
    summary: 'Allocates monthly net in-hand income into 50% Essential Needs, 30% Discretionary Wants, and 20% Financial Savings.',
    answer: `**The 50/30/20 Budget Framework:**
• **50% Needs:** Non-negotiable essentials — Rent, Home Loan EMI, Groceries, Utilities, Healthcare.
• **30% Wants:** Lifestyle enhancements — Dining out, entertainment, vacations, shopping.
• **20% Savings:** Wealth acceleration — SIPs, emergency funds, debt payoff.

**For a ₹200k/month Salary:**
• **Needs (50%):** **₹1,00,000**
• **Wants (30%):** **₹60,000**
• **Savings (20%):** **₹40,000**`
  },
  {
    id: 'inflation_purchasing_power',
    title: 'Inflation Adjustment & Real Purchasing Power',
    route: 'inflation',
    actionLabel: 'Open Inflation Adjuster',
    keywords: ['inflation', 'purchasing power', 'future cost', 'cpi', 'real value', 'erosion'],
    summary: 'Calculates the future cost of goods and depreciation of cash purchasing power over time.',
    answer: `**Understanding the Hidden Tax of Inflation:**
• At a historical **6.0% annual inflation rate**:
  - Purchasing power drops by **50% every 12 years**!
  - What costs **₹1,00,000 today** will require **₹1,79,000 in 10 years** and **₹3,20,000 in 20 years** to buy the exact same lifestyle!`
  },
  {
    id: 'buy_vs_rent',
    title: 'Buy vs Rent Financial Trajectory Comparison',
    route: 'buy-vs-rent',
    actionLabel: 'Open Buy vs Rent Calculator',
    keywords: ['buy vs rent', 'rent vs buy', 'homeownership', 'renting', 'real estate', 'down payment'],
    summary: 'Simulates net wealth outcomes of purchasing property vs renting and compounding the difference.',
    answer: `**The True Math of Buy vs. Rent:**
• Buying builds equity, but entails down payment opportunity cost, interest payments, property taxes, maintenance, and registration fees.
• Renting preserves capital liquidity: investing the surplus difference into index funds can match or exceed homeownership wealth over 15–20 years.`
  },
  {
    id: 'gst_and_business',
    title: 'Goods & Services Tax (GST) & Profitability',
    route: 'tax-gst',
    actionLabel: 'Open GST Calculator',
    keywords: ['gst', 'cgst', 'sgst', 'igst', 'add gst', 'remove gst', 'tax invoice', 'margin', 'markup'],
    summary: 'Computes GST additions, removals, and split CGST/SGST amounts across 5%, 12%, 18%, and 28% slabs.',
    answer: `**GST Calculations Made Easy:**
• **Add GST (Price Exclusive):** \`GST Amount = (Price × GST Rate) / 100\`
• **Remove GST (Price Inclusive):** \`Base Price = Price / (1 + GST Rate / 100)\`
• For intra-state sales, GST is split 50/50 into **CGST** and **SGST**.`
  }
];

/**
 * Parses user questions for dynamic mathematical calculation requests
 * e.g. "Calculate EMI for 60 lakhs at 8.5% for 20 years"
 */
export function evaluateDynamicMathQuery(q) {
  const query = q.toLowerCase();

  // 1. Dynamic EMI Calculation Request
  if (query.includes('emi') || (query.includes('loan') && (query.includes('lakh') || query.includes('cr') || query.includes('%')))) {
    const amountMatch = query.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|l|crore|crores|cr|k)?/i);
    const rateMatch = query.match(/(\d+(?:\.\d+)?)\s*%/);
    const yearMatch = query.match(/(\d+)\s*(?:years|year|yrs|yr)/);

    if (amountMatch) {
      let principal = parseFloat(amountMatch[1]);
      const unit = (amountMatch[2] || '').toLowerCase();
      if (unit.startsWith('l')) principal *= 100000;
      else if (unit.startsWith('c')) principal *= 10000000;
      else if (unit.startsWith('k')) principal *= 1000;
      else if (principal < 1000) principal *= 100000; // default assumption for "60 loan" -> 60 Lakhs

      const rate = rateMatch ? parseFloat(rateMatch[1]) : 8.5;
      const years = yearMatch ? parseInt(yearMatch[1], 10) : 20;
      const months = years * 12;

      const emiRes = calculateEMI(principal, rate, months);

      return {
        type: 'emi_calc',
        answer: `**Live EMI Calculation for ${formatCurrency(principal)}:**\n• **Monthly EMI:** **${formatCurrency(emiRes.monthlyEMI)}**\n• **Interest Rate:** ${rate}% per annum\n• **Tenure:** ${years} Years (${months} months)\n• **Total Interest:** **${formatCurrency(emiRes.totalInterest)}**\n• **Total Repayment:** **${formatCurrency(emiRes.totalPayment)}**`,
        actionLabel: `Apply ${formatCurrency(principal, undefined, false)} in EMI Calculator`,
        route: 'emi',
        params: {
          storeKey: 'emi',
          stateUpdates: {
            loanAmount: principal,
            interestRate: rate,
            tenureValue: years,
            isYears: true
          }
        }
      };
    }
  }

  // 2. Dynamic SIP Calculation Request
  if (query.includes('sip') || (query.includes('invest') && (query.includes('monthly') || query.includes('/mo')))) {
    const amountMatch = query.match(/(\d+(?:\.\d+)?)\s*(k|thousand|lakh|l)?/i);
    const rateMatch = query.match(/(\d+(?:\.\d+)?)\s*%/);
    const yearMatch = query.match(/(\d+)\s*(?:years|year|yrs|yr)/);

    if (amountMatch) {
      let monthly = parseFloat(amountMatch[1]);
      const unit = (amountMatch[2] || '').toLowerCase();
      if (unit.startsWith('k') || unit.startsWith('t')) monthly *= 1000;
      else if (unit.startsWith('l')) monthly *= 100000;
      else if (monthly < 100) monthly *= 1000; // e.g. "SIP of 25" -> ₹25,000

      const rate = rateMatch ? parseFloat(rateMatch[1]) : 12;
      const years = yearMatch ? parseInt(yearMatch[1], 10) : 15;

      const sipRes = calculateSIP(monthly, rate, years);

      return {
        type: 'sip_calc',
        answer: `**Live SIP Projection for ${formatCurrency(monthly)} / month:**\n• **Accumulated Corpus:** **${formatCurrency(sipRes.futureValue)}**\n• **Total Capital Invested:** ${formatCurrency(sipRes.totalInvested)}\n• **Compound Gains Earned:** **${formatCurrency(sipRes.estimatedReturns)}**\n• **Wealth Multiple:** ${sipRes.wealthGainMultiple}x over ${years} years (@ ${rate}% CAGR)`,
        actionLabel: `Apply ${formatCurrency(monthly, undefined, false)} in SIP Calculator`,
        route: 'invest-sip',
        params: {
          storeKey: 'investments',
          stateUpdates: {
            activeTab: 'sip',
            sipMonthly: monthly,
            sipRate: rate,
            sipYears: years
          }
        }
      };
    }
  }

  // 3. Dynamic Budget Allocation Request
  if (query.includes('budget') || query.includes('50/30/20') || query.includes('salary')) {
    const salaryMatch = query.match(/(\d+(?:\.\d+)?)\s*(k|lakh|lakhs|l|cr)?/i);
    if (salaryMatch && (query.includes('salary') || query.includes('budget') || query.includes('income'))) {
      let salary = parseFloat(salaryMatch[1]);
      const unit = (salaryMatch[2] || '').toLowerCase();
      if (unit.startsWith('k')) salary *= 1000;
      else if (unit.startsWith('l')) salary *= 100000;
      else if (salary < 1000) salary *= 1000; // e.g. "budget for 200k" -> ₹200,000

      const needs = salary * 0.5;
      const wants = salary * 0.3;
      const savings = salary * 0.2;

      return {
        type: 'budget_calc',
        answer: `**50/30/20 Budget Breakdown for ${formatCurrency(salary)} / month:**\n• **Needs (50%):** **${formatCurrency(needs)}** (Rent, EMIs, Groceries, Utilities)\n• **Wants (30%):** **${formatCurrency(wants)}** (Dining, Shopping, Entertainment)\n• **Savings (20%):** **${formatCurrency(savings)}** (SIPs, Emergency Reserve, PPF)`,
        actionLabel: `Load ${formatCurrency(salary, undefined, false)} into Budget Planner`,
        route: 'budget',
        params: {
          storeKey: 'budget',
          stateUpdates: {
            monthlyIncome: salary
          }
        }
      };
    }
  }

  return null;
}

/**
 * Perform Semantic / BM25-style keyword retrieval on query
 */
export function queryFinancialKnowledge(rawQuery) {
  // First check if user is asking for a live computation
  const dynamicCalc = evaluateDynamicMathQuery(rawQuery);
  if (dynamicCalc) {
    return {
      doc: {
        title: 'Instant Financial Calculation',
        route: dynamicCalc.route,
        actionLabel: dynamicCalc.actionLabel,
        answer: dynamicCalc.answer,
        params: dynamicCalc.params
      },
      score: 100
    };
  }

  const query = rawQuery.toLowerCase().trim();
  const tokens = query.split(/[\s,?.!]+/).filter((t) => t.length > 1);

  if (tokens.length === 0) {
    return null;
  }

  let bestMatch = null;
  let highestScore = 0;

  for (const doc of FINANCIAL_KNOWLEDGE_BASE) {
    let score = 0;

    // Check exact title match
    if (query.includes(doc.title.toLowerCase())) {
      score += 50;
    }

    // Check keywords
    for (const kw of doc.keywords) {
      if (query.includes(kw)) {
        score += 15;
      }
      for (const tok of tokens) {
        if (kw === tok) {
          score += 10;
        } else if (kw.includes(tok) || tok.includes(kw)) {
          score += 4;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = doc;
    }
  }

  // Threshold check
  if (highestScore >= 8) {
    return {
      doc: bestMatch,
      score: highestScore
    };
  }

  return null;
}
