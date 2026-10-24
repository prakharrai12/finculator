/**
 * Finculator Static Prerenderer & SEO Asset Generator
 * Generates standalone, crawlable HTML pages for all 27 calculators,
 * sitemap.xml, robots.txt, site.webmanifest, and humans.txt.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_URL = 'https://finculator.app';
const TODAY = '2026-10-24';

export const CALCULATOR_PAGES = [
  // 1. Loans & Mortgages
  {
    slug: 'emi-calculator',
    route: 'emi',
    name: 'EMI Calculator',
    pageTitle: 'EMI Calculator — Loan EMI & Amortization | Finculator',
    metaDescription: 'Calculate monthly loan EMI, total interest payable, and full amortization schedules for home, car, and personal loans with institutional precision. Free & private.',
    category: 'Loans & Mortgages',
    h1: 'Loan EMI Calculator',
    tagline: 'Institutional-grade loan repayment and amortization schedule engine',
    formula: 'E = P \\cdot r \\cdot \\frac{(1+r)^n}{(1+r)^n - 1}',
    formulaExplanation: 'Where E is the equated monthly installment (EMI), P is the principal loan amount, r is the periodic monthly interest rate (annual rate divided by 12 and 100), and n is the total tenure in months. Interest is calculated on the reducing opening balance each month.',
    example: 'For a ₹10,00,000 home loan at 8.50% annual interest over a 20-year tenure (240 months), your monthly EMI is ₹8,678.23. Total repayment over 20 years equals ₹20,82,775.20, consisting of ₹10,00,000 principal and ₹10,82,775.20 total interest charges.',
    faqs: [
      {
        q: 'How is a reducing-balance loan EMI calculated?',
        a: 'A reducing-balance loan computes interest exclusively on the outstanding loan principal at the beginning of each billing month. Each monthly payment is partitioned into interest charges and principal repayment. As principal decreases, interest drops and principal amortization accelerates.'
      },
      {
        q: 'Can prepayments significantly reduce my overall interest charges?',
        a: 'Yes. Any prepayment applied directly to loan principal immediately reduces the base against which future interest is calculated, shortening the amortization schedule and saving substantial compound interest.'
      },
      {
        q: 'Does this EMI calculator include processing fees and taxes?',
        a: 'Yes. Finculator allows you to configure processing fee percentages and loan terms to compute the true net lifetime cost of the borrowing facility.'
      },
      {
        q: 'Is my financial data uploaded or stored on any server?',
        a: 'No. All calculations are executed 100% locally on your device within your browser engine. Your numbers are completely private and never logged.'
      }
    ]
  },
  {
    slug: 'car-loan-calculator',
    route: 'emi',
    name: 'Car Loan EMI Calculator',
    pageTitle: 'Car Loan EMI Calculator — Auto Loan Rates | Finculator',
    metaDescription: 'Calculate monthly car loan EMIs, down payments, and total interest outlays for new and pre-owned automobiles. Free, instant, and private.',
    category: 'Loans & Mortgages',
    h1: 'Car Loan EMI Calculator',
    tagline: 'Plan vehicle financing with down payment and interest schedule analysis',
    formula: 'E = P \\cdot r \\cdot \\frac{(1+r)^n}{(1+r)^n - 1}',
    formulaExplanation: 'Where E is the monthly vehicle installment, P is the net financed car price (on-road cost minus down payment), r is the monthly interest rate, and n is the loan tenure in months (typically 36 to 84 months).',
    example: 'For an ₹8,00,000 auto loan financed at 9.25% APR for 5 years (60 months), the monthly EMI is ₹16,703.11. Total interest outlay equals ₹2,02,186.60 across the financing duration.',
    faqs: [
      {
        q: 'What is the ideal tenure for a car loan?',
        a: 'Most automotive financial advisors recommend keeping vehicle loan tenure under 5 years (60 months) to prevent owing more on the vehicle than its depreciating market value (negative vehicle equity).'
      },
      {
        q: 'How does down payment affect my monthly car loan EMI?',
        a: 'A higher initial down payment reduces the financed principal amount directly, resulting in lower monthly EMIs and significantly reduced lifetime interest charges.'
      }
    ]
  },
  {
    slug: 'home-loan-calculator',
    route: 'emi',
    name: 'Home Loan EMI Calculator',
    pageTitle: 'Home Loan EMI Calculator — Mortgage Amortization | Finculator',
    metaDescription: 'Calculate home loan EMIs, interest breakdowns, and tax-saving mortgage schedules for 10 to 30 year terms with institutional accuracy. 100% private.',
    category: 'Loans & Mortgages',
    h1: 'Home Loan EMI Calculator',
    tagline: 'Comprehensive residential mortgage repayment and amortization modeler',
    formula: 'E = P \\cdot r \\cdot \\frac{(1+r)^n}{(1+r)^n - 1}',
    formulaExplanation: 'Standard home mortgage reducing balance formula. Models long-term compounding over 120 to 360 monthly cycles, showing the gradual transition from interest-heavy to principal-heavy monthly allocations.',
    example: 'For a ₹50,00,000 home loan at 8.75% for 20 years (240 months), your monthly payment is ₹44,185.59. Total interest paid equals ₹56,04,541.60 over the tenure.',
    faqs: [
      {
        q: 'What tax benefits apply to home loan repayments in India?',
        a: 'Under the Old Tax Regime, Section 24(b) permits deductions up to ₹2,00,000 annually for interest paid on self-occupied property, while Section 80C allows principal deductions up to ₹1,50,000.'
      },
      {
        q: 'How do interest rate changes impact floating rate home loans?',
        a: 'When benchmark lending rates (such as RBI repo-linked lending rates) change, lenders typically adjust the remaining loan tenure or modify the monthly EMI proportionally.'
      }
    ]
  },
  {
    slug: 'personal-loan-calculator',
    route: 'emi',
    name: 'Personal Loan EMI Calculator',
    pageTitle: 'Personal Loan EMI Calculator — Compare Rates | Finculator',
    metaDescription: 'Calculate unsecured personal loan monthly EMIs, interest costs, and processing fees across 1 to 5 year tenures. Fast, accurate, and confidential.',
    category: 'Loans & Mortgages',
    h1: 'Personal Loan EMI Calculator',
    tagline: 'Instant monthly repayment computation for unsecured credit facilities',
    formula: 'E = P \\cdot r \\cdot \\frac{(1+r)^n}{(1+r)^n - 1}',
    formulaExplanation: 'Computes monthly installments for unsecured consumer and personal loans, where annual percentage rates generally range from 10.5% to 24%.',
    example: 'For a ₹3,00,000 personal loan at 12.5% interest for 3 years (36 months), the monthly installment is ₹10,035.79 with total interest payable of ₹61,288.44.',
    faqs: [
      {
        q: 'Are personal loan interest rates fixed or floating?',
        a: 'Most consumer personal loans in India and global retail banking are offered on fixed interest rates with structured reducing balance monthly schedules.'
      }
    ]
  },
  {
    slug: 'loan-prepayment-calculator',
    route: 'prepayment',
    name: 'Loan Prepayment & Payoff Analyzer',
    pageTitle: 'Loan Prepayment Calculator — Save Interest & Years | Finculator',
    metaDescription: 'Analyze the impact of extra monthly payments and annual lump sums on your mortgage. Calculate interest saved and years shaved off your loan.',
    category: 'Loans & Mortgages',
    h1: 'Loan Prepayment Analyzer',
    tagline: 'Simulate debt acceleration strategies to eliminate interest and finish early',
    formula: 'B_{m+1} = \\max(0, B_m \\cdot (1 + r) - \\text{EMI} - \\Delta P)',
    formulaExplanation: 'Where B_m is opening balance in month m, r is periodic interest rate, EMI is scheduled payment, and Delta P represents regular extra monthly payments or annual lump sums applied 100% to principal reduction.',
    example: 'Adding ₹5,000/month extra on a ₹30,00,000 20-year mortgage at 8.5% shaves over 4.5 years off the loan tenure and saves over ₹8,00,000 in compound interest.',
    faqs: [
      {
        q: 'Does prepayment penalty apply to floating rate home loans?',
        a: 'According to Reserve Bank of India (RBI) regulations, banks and housing finance companies cannot charge prepayment penalties on individual floating rate home loans.'
      }
    ]
  },
  {
    slug: 'loan-comparison-calculator',
    route: 'comparator',
    name: 'Loan Comparison Calculator',
    pageTitle: 'Loan Comparison Calculator — Compare 2 Loan Offers | Finculator',
    metaDescription: 'Compare two loan offers side-by-side. Analyze differences in monthly EMI, total interest, processing fees, and overall net lifetime borrowing cost.',
    category: 'Loans & Mortgages',
    h1: 'Loan Comparison Calculator',
    tagline: 'Side-by-side evaluation of competing lending terms and borrowing structures',
    formula: '\\Delta \\text{Cost} = \\text{Total Cost}_A - \\text{Total Cost}_B',
    formulaExplanation: 'Direct comparison of equated monthly obligations, effective APRs, and total lifetime borrowing cash outflows including origination and processing fees.',
    example: 'Comparing Loan A (8.50% with 1% processing fee) against Loan B (8.75% with zero fee) over 15 years reveals which option delivers lower net lifetime cost.',
    faqs: [
      {
        q: 'Why does a lower interest rate sometimes cost more overall?',
        a: 'High upfront processing fees, origination charges, or extended loan terms can easily outweigh a slight discount in nominal interest rate.'
      }
    ]
  },
  {
    slug: 'loan-eligibility-calculator',
    route: 'eligibility',
    name: 'Loan Eligibility & Borrowing Power Calculator',
    pageTitle: 'Loan Eligibility Calculator — FOIR & Borrowing Power | Finculator',
    metaDescription: 'Calculate maximum home and personal loan borrowing eligibility using bank FOIR (Fixed Obligation to Income Ratio) and debt-to-income benchmarks.',
    category: 'Loans & Mortgages',
    h1: 'Loan Eligibility Calculator',
    tagline: 'Reverse-solve your maximum bank borrowing capacity based on monthly income',
    formula: 'P_{\\max} = \\text{EMI}_{\\text{avail}} \\cdot \\frac{(1+r)^n - 1}{r(1+r)^n}, \\quad \\text{EMI}_{\\text{avail}} = (I \\cdot \\text{FOIR}) - \\text{EMI}_{\\text{existing}}',
    formulaExplanation: 'Where I is gross monthly income, FOIR is the bank Fixed Obligation to Income Ratio (typically 40% to 60%), and P_max is the maximum qualifying loan principal.',
    example: 'With ₹1,50,000 monthly income and ₹20,000 existing EMIs at 50% FOIR, your available EMI capacity is ₹55,000/mo, qualifying you for approximately ₹63.3 Lakhs at 8.5% over 20 years.',
    faqs: [
      {
        q: 'What is FOIR in banking loan underwriting?',
        a: 'FOIR stands for Fixed Obligation to Income Ratio. It represents the maximum percentage of your monthly income that lenders permit to be committed toward debt obligations.'
      }
    ]
  },
  {
    slug: 'credit-card-payoff-calculator',
    route: 'credit-card',
    name: 'Credit Card Payoff Calculator',
    pageTitle: 'Credit Card Payoff Calculator — Minimum Due Debt Trap | Finculator',
    metaDescription: 'See how paying only the minimum due on credit cards creates decades of debt. Calculate accelerated fixed payment strategies and interest savings.',
    category: 'Loans & Mortgages',
    h1: 'Credit Card Payoff Calculator',
    tagline: 'Expose the compounding interest trap of minimum due statements',
    formula: 'B_{m+1} = \\max(0, B_m \\cdot (1 + r) - \\text{Payment})',
    formulaExplanation: 'Models credit card revolving credit with typical APRs between 36% and 48%. Evaluates whether monthly payments cover monthly interest charges to prevent negative amortization.',
    example: 'On an outstanding ₹1,00,000 balance at 42% APR, paying only 5% minimum due takes over 15 years and over ₹2,40,000 in interest. A fixed ₹5,000 payment clears the card in under 3 years.',
    faqs: [
      {
        q: 'What is negative amortization on a credit card?',
        a: 'Negative amortization occurs when your monthly payment is less than the interest accrued in that billing cycle. The unpaid interest is added to your principal balance, causing debt to grow indefinitely.'
      }
    ]
  },

  // 2. Savings & Deposits
  {
    slug: 'compound-interest-calculator',
    route: 'savings-compound',
    name: 'Compound Interest Calculator',
    pageTitle: 'Compound Interest Calculator — Daily, Monthly, Annual | Finculator',
    metaDescription: 'Calculate compound interest growth with regular monthly contributions, custom compounding frequencies, and comprehensive annual balance schedules.',
    category: 'Savings & Deposits',
    h1: 'Compound Interest Calculator',
    tagline: 'Harness the power of exponential compound wealth accumulation',
    formula: 'A = P \\left(1 + \\frac{r}{n}\\right)^{nt} + \\text{PMT} \\cdot \\frac{(1 + r/n)^{nt} - 1}{r/n}',
    formulaExplanation: 'Where A is future balance, P is initial principal, r is annual interest rate, n is compounding frequency per year, t is time in years, and PMT is periodic contribution.',
    example: 'Investing ₹1,00,000 initially plus ₹10,000/month at 10% annual return compounded monthly grows to ₹20,48,449.78 over 10 years.',
    faqs: [
      {
        q: 'What compounding frequency provides the highest return?',
        a: 'More frequent compounding (e.g. daily or monthly) generates slightly higher effective annual yields than annual compounding because earned interest begins compounding sooner.'
      }
    ]
  },
  {
    slug: 'simple-interest-calculator',
    route: 'savings-simple',
    name: 'Simple Interest Calculator',
    pageTitle: 'Simple Interest Calculator — Fast Linear Interest | Finculator',
    metaDescription: 'Calculate simple interest, total maturity amounts, and annual growth schedules for short-term promissory notes and linear loans. Instant & free.',
    category: 'Savings & Deposits',
    h1: 'Simple Interest Calculator',
    tagline: 'Accurate linear return modeling for short-term credit and promissory notes',
    formula: 'I = P \\cdot r \\cdot t, \\quad A = P + I',
    formulaExplanation: 'Where I is total interest earned, P is initial capital, r is annual interest rate, and t is time duration in years.',
    example: 'A ₹50,000 loan at 8% simple interest over 3 years accrues ₹12,000 in interest, resulting in a total maturity value of ₹62,000.',
    faqs: [
      {
        q: 'Where is simple interest used today?',
        a: 'Simple interest is commonly used for short-term personal lending, select promissory notes, court judgment interest calculations, and bond coupon accrual.'
      }
    ]
  },
  {
    slug: 'fixed-deposit-calculator',
    route: 'savings-fd',
    name: 'Fixed Deposit (FD) Calculator',
    pageTitle: 'Fixed Deposit (FD) Calculator — Quarterly Compounding | Finculator',
    metaDescription: 'Calculate bank fixed deposit (FD) maturity values and interest yields using RBI standard quarterly compounding rules. Accurate for all banks.',
    category: 'Savings & Deposits',
    h1: 'Fixed Deposit (FD) Calculator',
    tagline: 'Standard quarterly compounding term deposit maturity calculator',
    formula: 'A = P \\left(1 + \\frac{r}{4}\\right)^{4t}',
    formulaExplanation: 'Under Indian banking conventions (RBI guidelines), term deposits compound on a quarterly basis (n = 4) across the deposit tenure.',
    example: 'A ₹1,00,000 FD booked at 7.50% interest for 1 year (12 months) yields ₹7,713.59 in interest, delivering a maturity payout of ₹1,07,713.59.',
    faqs: [
      {
        q: 'Why do Indian bank FDs compound quarterly?',
        a: 'Indian commercial banks adhere to Reserve Bank of India (RBI) guidelines that mandate interest on domestic term deposits exceeding 180 days be compounded quarterly.'
      }
    ]
  },
  {
    slug: 'recurring-deposit-calculator',
    route: 'savings-rd',
    name: 'Recurring Deposit (RD) Calculator',
    pageTitle: 'Recurring Deposit (RD) Calculator — Monthly Savings | Finculator',
    metaDescription: 'Calculate recurring deposit (RD) maturity payouts with quarterly compounding under standard Indian banking conventions. 100% accurate & free.',
    category: 'Savings & Deposits',
    h1: 'Recurring Deposit (RD) Calculator',
    tagline: 'Plan disciplined monthly bank savings with quarterly compounded returns',
    formula: 'A = \\sum_{m=1}^{n} P \\left(1 + \\frac{r}{4}\\right)^{4 \\cdot \\frac{n - m + 1}{12}}',
    formulaExplanation: 'Each monthly deposit P earns quarterly compounded interest for its exact remaining tenure in the deposit term.',
    example: 'Depositing ₹5,000/month in an RD at 7.00% for 12 months amounts to ₹60,000 invested, maturing at ₹62,319.64 with ₹2,319.64 in earned interest.',
    faqs: [
      {
        q: 'How does an RD differ from an SIP?',
        a: 'An RD is a guaranteed-return fixed income deposit backed by banking regulations, whereas an SIP invests in market-linked mutual funds with variable returns.'
      }
    ]
  },
  {
    slug: 'ppf-calculator',
    route: 'savings-ppf',
    name: 'PPF (Public Provident Fund) Calculator',
    pageTitle: 'PPF Calculator — 15-Year Tax-Free Government Growth | Finculator',
    metaDescription: 'Calculate Public Provident Fund (PPF) 15-year maturity values, annual interest accrual, and tax-free wealth accumulation under EEE tax status.',
    category: 'Savings & Deposits',
    h1: 'Public Provident Fund (PPF) Calculator',
    tagline: 'Government-backed 15-year tax-advantaged sovereign savings engine',
    formula: 'B_y = (B_{y-1} + P) \\cdot (1 + r)',
    formulaExplanation: 'PPF balances compound annually. Deposits made before the 5th of each month qualify for full interest accrual during that calendar month.',
    example: 'Investing the maximum statutory ₹1,50,000 annually in PPF at 7.1% interest yields ₹40,68,209 at 15-year maturity from ₹22,50,000 total contributions.',
    faqs: [
      {
        q: 'What is the EEE tax status of PPF?',
        a: 'Exempt-Exempt-Exempt (EEE) means your contributions qualify for Section 80C deductions, annual interest accrual is tax-free, and maturity payouts are completely tax-exempt.'
      }
    ]
  },
  {
    slug: 'goal-savings-calculator',
    route: 'savings-goal',
    name: 'Goal-Based Savings Calculator',
    pageTitle: 'Goal-Based Savings Calculator — Reach Target Corpus | Finculator',
    metaDescription: 'Reverse-solve the exact monthly savings required to achieve future financial goals like home purchases, education, weddings, or emergency reserves.',
    category: 'Savings & Deposits',
    h1: 'Goal-Based Savings Calculator',
    tagline: 'Reverse-engineer your monthly savings target to achieve your future goal',
    formula: '\\text{PMT} = \\frac{\\text{Target} - P_0 (1 + r)^t}{\\frac{(1 + r/12)^{12t} - 1}{r/12}}',
    formulaExplanation: 'Computes required monthly annuity deposits needed to bridge the shortfall between current initial savings and your target future corpus.',
    example: 'To accumulate ₹25,00,000 for a child’s education in 7 years starting with ₹2,00,000 at 11% expected return, you need to save ₹17,942 per month.',
    faqs: [
      {
        q: 'Should I factor inflation into my financial target corpus?',
        a: 'Yes. A goal that costs ₹20 Lakhs today will cost significantly more in 10 years due to inflation. Combine this with our Inflation Calculator for best results.'
      }
    ]
  },

  // 3. Wealth & Investing
  {
    slug: 'sip-calculator',
    route: 'invest-sip',
    name: 'SIP Calculator',
    pageTitle: 'SIP Calculator — Mutual Fund Wealth Accumulation | Finculator',
    metaDescription: 'Calculate Systematic Investment Plan (SIP) returns for equity mutual funds. Visualize compound growth, wealth gain multiples, and yearly breakdowns.',
    category: 'Wealth & Investing',
    h1: 'SIP Calculator',
    tagline: 'Standard monthly mutual fund Systematic Investment Plan wealth engine',
    formula: 'M = P \\cdot \\frac{(1 + i)^n - 1}{i} \\cdot (1 + i)',
    formulaExplanation: 'Where M is future maturity value, P is monthly investment, i is periodic monthly return rate (r/12), and n is total number of monthly installments.',
    example: 'Investing ₹10,000/month at 12% expected annual return over 15 years results in ₹18,00,000 invested and a final estimated corpus of ₹50,45,760.',
    faqs: [
      {
        q: 'What is Rupee Cost Averaging in SIP investing?',
        a: 'By investing a fixed sum monthly, you automatically acquire more mutual fund units when market prices drop and fewer units when prices rise, averaging out acquisition costs.'
      }
    ]
  },
  {
    slug: 'step-up-sip-calculator',
    route: 'invest-stepup',
    name: 'Step-Up SIP Calculator',
    pageTitle: 'Step-Up SIP Calculator — Top-Up Annual Growth | Finculator',
    metaDescription: 'Calculate Step-Up SIP returns with annual contribution increases. Model how a 10% yearly boost dramatically compounds your long-term mutual fund wealth.',
    category: 'Wealth & Investing',
    h1: 'Step-Up SIP Calculator',
    tagline: 'Model accelerated compounding by raising your monthly deposit annually',
    formula: 'M = \\sum_{y=1}^{t} \\sum_{m=1}^{12} P_y (1 + i)^{12(t - y) + (12 - m + 1)}, \\quad P_y = P_0 (1 + s)^{y-1}',
    formulaExplanation: 'Where P_0 is initial monthly installment and s is the annual step-up percentage (typically aligned with annual salary increments).',
    example: 'Starting with ₹10,000/month and stepping up by 10% each year at 12% return builds ₹87.8 Lakhs over 15 years—over 74% higher than a fixed ₹10k SIP!',
    faqs: [
      {
        q: 'Why is Step-Up SIP more effective than a fixed SIP?',
        a: 'As your career progresses and salary grows, stepping up your monthly contributions channels fresh capital directly into compounding without increasing your living frugality.'
      }
    ]
  },
  {
    slug: 'sip-lump-sum-calculator',
    route: 'invest-combined',
    name: 'SIP + Lump Sum Combined Calculator',
    pageTitle: 'SIP + Lump Sum Calculator — Combined Investment Growth | Finculator',
    metaDescription: 'Calculate portfolio returns from deploying an initial lump sum alongside ongoing monthly SIP contributions. Realistic hybrid portfolio compounding.',
    category: 'Wealth & Investing',
    h1: 'SIP + Lump Sum Combined Calculator',
    tagline: 'Simulate hybrid wealth growth combining seed capital with monthly deposits',
    formula: 'M = P_0 (1 + r)^t + \\text{PMT} \\cdot \\frac{(1 + i)^n - 1}{i} \\cdot (1 + i)',
    formulaExplanation: 'Blends lump-sum compound interest on initial seed capital P_0 with recurring monthly annuity compounding PMT.',
    example: 'Investing ₹5,00,000 upfront plus ₹15,000/month at 12% for 10 years builds a corpus of ₹50,38,349 from ₹23,00,000 total capital deployed.',
    faqs: [
      {
        q: 'When should I combine lump sum and SIP?',
        a: 'If you receive an annual bonus, inheritance, or liquidation event, deploying the lump sum immediately puts capital to work while monthly SIPs maintain regular discipline.'
      }
    ]
  },
  {
    slug: 'lump-sum-calculator',
    route: 'invest-lump',
    name: 'Lump Sum Investment Calculator',
    pageTitle: 'Lump Sum Calculator — Mutual Fund One-Time Growth | Finculator',
    metaDescription: 'Calculate one-time mutual fund and stock market investment compounding. See future value projections and wealth gain multiples across 1 to 30 years.',
    category: 'Wealth & Investing',
    h1: 'Lump Sum Investment Calculator',
    tagline: 'One-time investment compounding trajectory across market horizons',
    formula: 'A = P (1 + r)^t',
    formulaExplanation: 'Standard annual compound growth on single one-time capital allocations.',
    example: 'A single one-time investment of ₹10,00,000 compounded at 12% for 15 years grows to ₹54,73,565.76—more than 5.4 times your initial capital.',
    faqs: [
      {
        q: 'Is lump sum better than SIP during market dips?',
        a: 'Historically, deploying capital in lump sums during market corrections allows investors to lock in discounted valuations and maximize long-term compound gains.'
      }
    ]
  },
  {
    slug: 'cagr-calculator',
    route: 'invest-cagr',
    name: 'CAGR (Compound Annual Growth Rate) Calculator',
    pageTitle: 'CAGR Calculator — Compound Annual Growth Rate | Finculator',
    metaDescription: 'Calculate accurate Compound Annual Growth Rate (CAGR) and annualized percentage returns between initial and final investment valuations over any duration.',
    category: 'Wealth & Investing',
    h1: 'CAGR Calculator',
    tagline: 'Measure standardized annualized returns on assets across any holding period',
    formula: '\\text{CAGR} = \\left( \\frac{V_1}{V_0} \\right)^{\\frac{1}{t}} - 1',
    formulaExplanation: 'Where V_0 is initial investment, V_1 is final valuation, and t is holding period in years (supports decimal/fractional tenures).',
    example: 'An investment growing from ₹2,00,000 to ₹5,50,000 over 6.5 years generated an annual compound growth rate (CAGR) of 16.92%.',
    faqs: [
      {
        q: 'How does CAGR differ from Absolute Return?',
        a: 'Absolute return measures total percentage gain regardless of time. CAGR normalizes growth on an annualized basis, making investments over different periods comparable.'
      }
    ]
  },
  {
    slug: 'investment-returns-calculator',
    route: 'invest-returns',
    name: 'Investment Returns Calculator',
    pageTitle: 'Investment Returns Calculator — Absolute vs Annualized | Finculator',
    metaDescription: 'Calculate absolute and annualized returns on stocks and mutual funds including dividend income received. Professional portfolio metrics.',
    category: 'Wealth & Investing',
    h1: 'Investment Returns Calculator',
    tagline: 'Evaluate total investment gain incorporating price appreciation and dividends',
    formula: '\\text{Total Return} = \\frac{(V_1 + D) - V_0}{V_0} \\times 100',
    formulaExplanation: 'Incorporates both ending market valuation V_1 and total accumulated dividend distributions D relative to original purchase price V_0.',
    example: 'A stock purchase of ₹1,00,000 sold for ₹1,40,000 after 2 years with ₹8,000 in dividends delivered a 48.0% absolute return and 21.66% annualized return.',
    faqs: [
      {
        q: 'Why should dividends be included in return calculations?',
        a: 'Dividends are cash flow distributions that represent a vital component of total equity shareholder return (Total Shareholder Return / TSR).'
      }
    ]
  },

  // 4. Tax & Business
  {
    slug: 'income-tax-calculator',
    route: 'tax-income',
    name: 'Income Tax Calculator',
    pageTitle: 'Income Tax Calculator — Budget 2025 Slabs (Old vs New) | Finculator',
    metaDescription: 'Calculate income tax under Budget 2025 FY 2025-26 & FY 2024-25. Compare New vs Old Tax Regimes with exact Section 87A rebate and marginal relief.',
    category: 'Tax & Business',
    h1: 'Income Tax Calculator',
    tagline: 'Updated for Union Budget 2025 with Section 87A rebate and marginal relief',
    formula: '\\text{Tax} = \\text{SlabTax} - \\text{Rebate}_{87A} + \\text{Surcharge} + \\text{Cess}_{4\\%}',
    formulaExplanation: 'Implements official Indian Income Tax Department tax slabs, salaried standard deduction (₹75k for new regime, ₹50k for old), Section 87A full rebate up to ₹12L in Budget 2025 with statutory marginal relief proviso.',
    example: 'Under Budget 2025 (FY 2025-26), a salaried individual earning up to ₹12,75,000 pays ₹0 tax in the New Regime thanks to the ₹75,000 standard deduction and Section 87A rebate.',
    faqs: [
      {
        q: 'What are the New Tax Regime slabs for FY 2025-26 (AY 2026-27)?',
        a: '0 to ₹4 Lakhs: Nil; ₹4L to ₹8L: 5%; ₹8L to ₹12L: 10%; ₹12L to ₹16L: 15%; ₹16L to ₹20L: 20%; ₹20L to ₹24L: 25%; Above ₹24L: 30%. Standard deduction is ₹75,000.'
      },
      {
        q: 'How does Section 87A marginal relief work in Budget 2025?',
        a: 'If taxable income slightly exceeds ₹12,00,000, your tax payable before cess is strictly capped at the amount exceeding ₹12 Lakhs, preventing sudden tax penalties on small salary increases.'
      }
    ]
  },
  {
    slug: 'take-home-salary-calculator',
    route: 'tax-salary',
    name: 'In-Hand Take-Home Salary Calculator',
    pageTitle: 'Take-Home Salary Calculator — Monthly In-Hand CTC Pay | Finculator',
    metaDescription: 'Calculate monthly in-hand net salary from annual CTC. Accurately deducts Employee PF, Employer PF, Professional Tax, and Income Tax.',
    category: 'Tax & Business',
    h1: 'Take-Home Salary Calculator',
    tagline: 'Translate annual CTC into exact monthly take-home bank credit',
    formula: '\\text{Net Monthly} = \\frac{\\text{CTC} - (\\text{EPF} + \\text{EmployerPF} + \\text{PT} + \\text{AnnualTax})}{12}',
    formulaExplanation: 'Calibrated for corporate compensation structures including statutory EPF contributions (12% of basic up to statutory ceiling) and monthly professional tax.',
    example: 'For a ₹24,00,000 CTC (₹2,00,000/month baseline) with 40% basic, net monthly in-hand pay is approximately ₹1,67,200 after statutory deductions and income taxes.',
    faqs: [
      {
        q: 'Why is take-home pay lower than CTC divided by 12?',
        a: 'Cost to Company (CTC) includes non-cash components such as employer PF contributions, gratuity provisions, insurance premiums, and statutory tax withholdings (TDS).'
      }
    ]
  },
  {
    slug: 'gst-calculator',
    route: 'tax-gst',
    name: 'GST Calculator',
    pageTitle: 'GST Calculator — Add or Remove GST Slabs (5%, 12%, 18%, 28%) | Finculator',
    metaDescription: 'Calculate Goods and Services Tax (GST). Add GST to base invoices or reverse-calculate GST from gross inclusive amounts. Computes CGST and SGST splits.',
    category: 'Tax & Business',
    h1: 'GST Calculator',
    tagline: 'Exclusive and inclusive GST computation with automatic CGST / SGST split',
    formula: '\\text{Add: } GST = A \\cdot r, \\quad \\text{Remove: } Net = \\frac{A}{1 + r}',
    formulaExplanation: 'Supports standard 5%, 12%, 18%, 28% slabs and special gold/precious rates with automatic 50/50 division between Central and State GST.',
    example: 'For an ₹18,000 invoice at 18% GST (Exclusive), total payable is ₹21,240 (CGST ₹1,620 + SGST ₹1,620). If ₹21,240 is GST-inclusive, net base price is ₹18,000.',
    faqs: [
      {
        q: 'What is the split between CGST and SGST?',
        a: 'For intra-state commercial transactions, GST is evenly divided (50/50) between Central GST (CGST) and State GST (SGST).'
      }
    ]
  },
  {
    slug: 'profit-margin-calculator',
    route: 'tax-margin',
    name: 'Profit Margin & Markup Calculator',
    pageTitle: 'Profit Margin & Markup Calculator — Gross Margin % | Finculator',
    metaDescription: 'Calculate gross profit margin percentage and markup percentage from cost price and selling price. Accurately price products and commercial services.',
    category: 'Tax & Business',
    h1: 'Profit Margin & Markup Calculator',
    tagline: 'Clarify the mathematical difference between margin and markup for commercial pricing',
    formula: '\\text{Margin } \\% = \\frac{P - C}{P} \\times 100, \\quad \\text{Markup } \\% = \\frac{P - C}{C} \\times 100',
    formulaExplanation: 'Where P is selling price and C is unit cost price. Profit margin measures profit relative to revenue; markup measures profit relative to cost.',
    example: 'A product bought for ₹60 and sold for ₹100 yields ₹40 profit, corresponding to a 40.0% gross profit margin and a 66.67% markup on cost.',
    faqs: [
      {
        q: 'Why is markup percentage always higher than profit margin?',
        a: 'Markup divides unit profit by cost (a smaller number), while margin divides unit profit by selling price (a larger number).'
      }
    ]
  },
  {
    slug: 'break-even-calculator',
    route: 'tax-breakeven',
    name: 'Break-Even Analysis Calculator',
    pageTitle: 'Break-Even Analysis Calculator — Volume & Revenue | Finculator',
    metaDescription: 'Calculate business break-even unit volume and revenue from fixed overhead and variable costs. Plan production targets and pricing feasibility.',
    category: 'Tax & Business',
    h1: 'Break-Even Analysis Calculator',
    tagline: 'Determine the exact sales volume needed to cover overhead and achieve profitability',
    formula: '\\text{Break-Even Units} = \\frac{\\text{Fixed Costs}}{\\text{Price} - \\text{Variable Cost}}',
    formulaExplanation: 'Calculates the volume of unit sales needed where total contribution margin equals total fixed organizational overhead.',
    example: 'With ₹1,00,000 monthly fixed rent and salaries, ₹40 variable unit cost, and ₹100 selling price, you must sell 1,667 units (₹1,66,700 revenue) to break even.',
    faqs: [
      {
        q: 'What is contribution margin in break-even analysis?',
        a: 'Contribution margin is unit selling price minus variable unit costs. It represents the portion of sales revenue available to cover fixed organizational expenses.'
      }
    ]
  },

  // 5. Long-Term Planning & Portfolio
  {
    slug: 'fire-calculator',
    route: 'fire',
    name: 'FIRE (Financial Independence, Retire Early) Calculator',
    pageTitle: 'FIRE Calculator — Financial Independence & Early Retirement | Finculator',
    metaDescription: 'Calculate your FIRE number and early retirement corpus. Model Lean FIRE, Fat FIRE, Coast FIRE, safe withdrawal rates (SWR), and required monthly savings.',
    category: 'Long-Term Planning',
    h1: 'FIRE & Retirement Calculator',
    tagline: 'Determine the exact nest egg needed to achieve financial freedom and retire early',
    formula: '\\text{FIRE Target} = \\frac{\\text{Future Annual Expenses}}{\\text{SWR}}',
    formulaExplanation: 'Where Future Annual Expenses are inflation-adjusted over the horizon to your target retirement age, and SWR is your Safe Withdrawal Rate (typically 3.5% to 4.0%).',
    example: 'A 30-year-old spending ₹50,000/month today who plans to retire at 48 with 6% inflation and 4% SWR requires a ₹4.28 Crore retirement corpus.',
    faqs: [
      {
        q: 'What is the 4% Safe Withdrawal Rate (SWR)?',
        a: 'Derived from the landmark Trinity Study, the 4% rule suggests an investor can withdraw 4% of their initial portfolio in year one, adjusted for inflation annually, with high probability of lasting 30+ years.'
      },
      {
        q: 'What is the difference between Lean FIRE and Fat FIRE?',
        a: 'Lean FIRE covers only baseline, non-negotiable survival expenses (typically 75% of standard target), while Fat FIRE accommodates luxury, travel, and discretionary spending (130%+ of target).'
      }
    ]
  },
  {
    slug: 'inflation-calculator',
    route: 'inflation',
    name: 'Inflation & Purchasing Power Calculator',
    pageTitle: 'Inflation Calculator — Purchasing Power & Future Cost | Finculator',
    metaDescription: 'Calculate the erosive effect of inflation on money over time. See future replacement costs and purchasing power decay across 1 to 40 years.',
    category: 'Long-Term Planning',
    h1: 'Inflation & Purchasing Power Calculator',
    tagline: 'Understand how annual consumer inflation erodes the real value of cash savings',
    formula: '\\text{Future Cost} = P (1 + r)^t, \\quad \\text{Purchasing Power} = \\frac{P}{(1 + r)^t}',
    formulaExplanation: 'Applies compound inflation rates to illustrate the rising future nominal cost of goods and the decay of fixed cash reserves.',
    example: '₹1,00,000 today will require ₹1,79,085 in 10 years at 6% annual inflation to purchase the identical basket of goods. Cash purchasing power falls by 44.16%.',
    faqs: [
      {
        q: 'Why is inflation termed the "hidden tax"?',
        a: 'Inflation silently reduces what each unit of currency buys over time, diminishing the real purchasing power of cash kept in sub-inflation bank accounts.'
      }
    ]
  },
  {
    slug: 'net-worth-calculator',
    route: 'net-worth',
    name: 'Net Worth Calculator',
    pageTitle: 'Net Worth Calculator — Track Assets vs Liabilities | Finculator',
    metaDescription: 'Calculate personal net worth by aggregating liquid accounts, real estate, equity investments, and retirement funds against mortgages and debts.',
    category: 'Long-Term Planning',
    h1: 'Net Worth Calculator',
    tagline: 'Consolidate your complete balance sheet to assess financial solvency',
    formula: '\\text{Net Worth} = \\sum \\text{Assets} - \\sum \\text{Liabilities}',
    formulaExplanation: 'Aggregates all cash, market holdings, real estate, retirement accounts, and personal property, subtracted by total mortgage and consumer debt.',
    example: 'Holding ₹78,00,000 in combined property, mutual funds, EPF, and bank balances against ₹27,50,000 in mortgage and debts establishes a personal net worth of ₹50,50,000.',
    faqs: [
      {
        q: 'What is the debt-to-asset ratio?',
        a: 'The debt-to-asset ratio is your total liabilities divided by total assets. Ratios below 35% generally reflect strong personal solvency and low leverage risk.'
      }
    ]
  },
  {
    slug: 'budget-planner-calculator',
    route: 'budget',
    name: '50/30/20 Budget Planner',
    pageTitle: '50/30/20 Budget Planner — Needs, Wants & Savings | Finculator',
    metaDescription: 'Divide take-home salary into 50% essential needs, 30% lifestyle wants, and 20% savings. Master cash flow allocation and eliminate overspending.',
    category: 'Long-Term Planning',
    h1: '50/30/20 Budget Planner',
    tagline: 'The gold-standard personal cash flow rule for balanced financial wellness',
    formula: '\\text{Needs} = 50\\%, \\quad \\text{Wants} = 30\\%, \\quad \\text{Savings} = 20\\%',
    formulaExplanation: 'Allocates monthly net take-home salary into essentials (housing, groceries, utilities, debt), lifestyle discretionary spending, and savings.',
    example: 'On an in-hand monthly salary of ₹1,00,000, the 50/30/20 framework budgets ₹50,000 for essentials, ₹30,000 for lifestyle, and ₹20,000 for wealth-building investments.',
    faqs: [
      {
        q: 'Can the 50/30/20 rule be adjusted for high cost of living cities?',
        a: 'Yes. In high-rent metropolitan areas, many financial planners recommend a 60/20/20 or 50/20/30 allocation to maintain disciplined savings while covering essential rent.'
      }
    ]
  },
  {
    slug: 'buy-vs-rent-calculator',
    route: 'buy-vs-rent',
    name: 'Buy vs. Rent Comparison Calculator',
    pageTitle: 'Buy vs Rent Calculator — Real Estate Wealth Trajectory | Finculator',
    metaDescription: 'Compare home buying equity against renting and investing the difference in the stock market. Models property appreciation, taxes, and opportunity costs.',
    category: 'Long-Term Planning',
    h1: 'Buy vs. Rent Comparison Calculator',
    tagline: 'Comprehensive long-term wealth evaluation: Home ownership vs. Renting & Investing',
    formula: '\\text{Net Worth Comparison over } t \\text{ years Incorporating Cash Flow Opportunity Cost}',
    formulaExplanation: 'Simulates monthly mortgage, property tax, maintenance, and home equity growth versus renting, where monthly cash flow differentials and down payment are invested in market equities.',
    example: 'Purchasing a ₹75 Lakh home with 20% down at 8.5% compared to renting for ₹25,000/mo and investing the down payment at 11% market return reveals which path builds superior net worth over 15 years.',
    faqs: [
      {
        q: 'What is the opportunity cost of home buying?',
        a: 'The opportunity cost includes the initial down payment and higher early ownership expenses that could have otherwise been invested in compounding financial assets like equities.'
      }
    ]
  },
  {
    slug: 'portfolio-builder',
    route: 'portfolio',
    name: 'Personal Portfolio Statement (PFS) Builder',
    pageTitle: 'Portfolio Statement Builder — Institutional Balance Sheet | Finculator',
    metaDescription: 'Build an audit-grade Personal Financial Statement (PFS). Track asset allocations, emergency runway, solvency ratios, and export formal PDF dossiers.',
    category: 'Long-Term Planning',
    h1: 'Personal Portfolio Statement Builder',
    tagline: 'Institutional-grade balance sheet, cash flow ledger, and wealth governance suite',
    formula: '\\text{Net Worth} = \\text{Assets} - \\text{Liabilities}, \\quad \\text{Runway} = \\frac{\\text{Liquid Assets}}{\\text{Monthly Burn}}',
    formulaExplanation: 'Provides formal balance sheet aggregation across liquid, market, real estate, and retirement holdings with emergency survival runway calculations.',
    example: 'Consolidates multi-asset portfolios, calculates debt service coverage, monitors emergency fund sufficiency, and produces bank-ready PDF financial statements.',
    faqs: [
      {
        q: 'What is a Personal Financial Statement (PFS)?',
        a: 'A PFS is a comprehensive document providing an audit-grade snapshot of an individual’s financial standing, including all assets, liabilities, and net worth.'
      }
    ]
  }
];

function generateJSONLD(page) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${BASE_URL}/${page.slug}.html#software`,
        'name': `${page.name} — Finculator`,
        'url': `${BASE_URL}/${page.slug}.html`,
        'applicationCategory': 'FinanceApplication',
        'operatingSystem': 'All modern web browsers',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'description': page.metaDescription,
        'featureList': [
          'Instant client-side calculation with 100% privacy',
          'Interactive visualizations and amortization schedules',
          'Institutional-grade financial formula accuracy',
          'Downloadable CSV and formal PDF export'
        ]
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/${page.slug}.html#breadcrumbs`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${BASE_URL}/`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': page.category,
            'item': `${BASE_URL}/#/${page.route}`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': page.name,
            'item': `${BASE_URL}/${page.slug}.html`
          }
        ]
      }
    ]
  };

  if (page.faqs && page.faqs.length > 0) {
    schema['@graph'].push({
      '@type': 'FAQPage',
      '@id': `${BASE_URL}/${page.slug}.html#faq`,
      'mainEntity': page.faqs.map((f) => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.a
        }
      }))
    });
  }

  return JSON.stringify(schema, null, 2);
}

function buildHTMLPage(baseHTML, page) {
  const canonicalUrl = `${BASE_URL}/${page.slug}.html`;
  const jsonLd = generateJSONLD(page);

  // FAQ HTML block
  const faqItemsHTML = page.faqs && page.faqs.length > 0
    ? page.faqs.map(f => `
        <details class="seo-faq-item">
          <summary class="seo-faq-question">
            <span>${escapeHTML(f.q)}</span>
            <svg class="seo-faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </summary>
          <div class="seo-faq-answer">
            <p>${escapeHTML(f.a)}</p>
          </div>
        </details>
      `).join('')
    : '';

  // Rich SEO knowledge content rendered cleanly beneath the calculator mount
  const seoSectionHTML = `
    <!-- Comprehensive Semantic SEO & Methodology Section -->
    <section class="seo-knowledge-section" aria-label="Methodology and Financial Formulas">
      <div class="seo-knowledge-card">
        <div class="seo-card-header">
          <span class="seo-badge">${escapeHTML(page.category.toUpperCase())} METHODOLOGY</span>
          <h2 class="seo-section-title">How the ${escapeHTML(page.name)} Works</h2>
          <p class="seo-section-desc">${escapeHTML(page.tagline)}</p>
        </div>

        <div class="seo-formula-box">
          <span class="seo-box-label">GOVERNING MATHEMATICAL FORMULA</span>
          <code class="seo-formula-code">${escapeHTML(page.formula)}</code>
          <p class="seo-formula-text">${escapeHTML(page.formulaExplanation)}</p>
        </div>

        <div class="seo-example-box">
          <span class="seo-box-label">PRACTICAL STEP-BY-STEP CALCULATION EXAMPLE</span>
          <p class="seo-example-text">${escapeHTML(page.example)}</p>
        </div>

        ${faqItemsHTML ? `
        <div class="seo-faq-container">
          <h3 class="seo-faq-title">Frequently Asked Questions</h3>
          <div class="seo-faq-list">
            ${faqItemsHTML}
          </div>
        </div>
        ` : ''}

        <div class="seo-disclaimer-box">
          <span class="seo-disclaimer-title">FINANCIAL ACCURACY & DISCLAIMER</span>
          <p class="seo-disclaimer-text">
            Calculations performed by Finculator are for educational and illustrative purposes only. Formulas adhere to established banking and regulatory standards (including Reserve Bank of India conventions and Union Budget provisions). Individual loan sanctions, investment returns, and tax liabilities depend on individual lender underwriting, market performance, and specific tax circumstances. Consult a qualified financial advisor or chartered accountant before making binding capital decisions.
          </p>
        </div>
      </div>
    </section>
  `;

  // Clone base template and replace meta headers
  let html = baseHTML;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHTML(page.pageTitle)}</title>`);

  // Replace Meta Description
  html = html.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${escapeHTML(page.metaDescription)}" />`);

  // Inject Canonical, OG, Twitter, and Schema
  const headInjection = `
  <!-- Canonical & Social Meta Tags -->
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:site_name" content="Finculator" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHTML(page.pageTitle)}" />
  <meta property="og:description" content="${escapeHTML(page.metaDescription)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${BASE_URL}/docs/images/finculator-logo.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHTML(page.pageTitle)}" />
  <meta name="twitter:description" content="${escapeHTML(page.metaDescription)}" />
  <meta name="twitter:image" content="${BASE_URL}/docs/images/finculator-logo.png" />

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
${jsonLd}
  </script>
`;

  html = html.replace('</head>', `${headInjection}</head>`);

  // Inject data-auto-route and static SEO content into main-content
  const mainTarget = '<main class="app-content" id="main-content" role="main">';
  const mainReplacement = `<main class="app-content" id="main-content" role="main" data-auto-route="${page.route}">\n${seoSectionHTML}`;
  html = html.replace(mainTarget, mainReplacement);

  return html;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateSitemap(pages) {
  const urlEntries = [
    `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`
  ];

  pages.forEach(p => {
    urlEntries.push(`  <url>
    <loc>${BASE_URL}/${p.slug}.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
  });

  // Legal and company pages
  const staticPages = ['about.html', 'privacy.html', 'terms.html', 'disclaimer.html', 'contact.html'];
  staticPages.forEach(sp => {
    urlEntries.push(`  <url>
    <loc>${BASE_URL}/${sp}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;
}

function generateRobotsTXT() {
  return `# https://finculator.app robots.txt
User-agent: *
Allow: /
Disallow: /api/auth/
Disallow: /data/

Sitemap: ${BASE_URL}/sitemap.xml
`;
}

function generateWebManifest() {
  return JSON.stringify({
    name: 'Finculator — Financial Calculators & Portfolio Builder',
    short_name: 'Finculator',
    description: 'Institutional-grade suite of 27 financial calculators, tax planning engines, and personal portfolio statements.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0b0e',
    theme_color: '#0a0b0e',
    icons: [
      {
        src: '/docs/images/finculator-icon.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/docs/images/finculator-logo.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }, null, 2);
}

function generateHumansTXT() {
  return `/* TEAM */
Platform: Finculator
Engineering Lead: DeepMind Principal Systems & Fintech Team
Design Standard: Obsidian Slate Minimalist Financial System
Location: Global / India

/* SITE */
Standards: HTML5, CSS3, Vanilla ES Modules, Web Components, WAI-ARIA WCAG 2.2 AA
Components: 27 Institutional Financial Calculators, Personal Portfolio Statement (PFS) Builder
Privacy Guarantee: Zero data collection, 100% client-side computation isolation
`;
}

export function runGenerator() {
  console.log('--- Generating Finculator SEO Pages & Assets ---');
  const baseIndexHTML = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');

  // 1. Generate Static Calculator Pages
  let count = 0;
  for (const page of CALCULATOR_PAGES) {
    const pageHTML = buildHTMLPage(baseIndexHTML, page);
    const destPath = path.join(ROOT_DIR, `${page.slug}.html`);
    fs.writeFileSync(destPath, pageHTML, 'utf-8');
    count++;
  }
  console.log(`[OK] Generated ${count} static prerendered HTML calculator pages.`);

  // 2. Generate sitemap.xml
  const sitemapXML = generateSitemap(CALCULATOR_PAGES);
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXML, 'utf-8');
  console.log('[OK] Generated sitemap.xml.');

  // 3. Generate robots.txt
  const robotsTXT = generateRobotsTXT();
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsTXT, 'utf-8');
  console.log('[OK] Generated robots.txt.');

  // 4. Generate site.webmanifest
  const webmanifest = generateWebManifest();
  fs.writeFileSync(path.join(ROOT_DIR, 'site.webmanifest'), webmanifest, 'utf-8');
  console.log('[OK] Generated site.webmanifest.');

  // 5. Generate humans.txt
  const humans = generateHumansTXT();
  fs.writeFileSync(path.join(ROOT_DIR, 'humans.txt'), humans, 'utf-8');
  console.log('[OK] Generated humans.txt.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runGenerator();
}
