# Finculator Technical SEO & Organic Acquisition Playbook

This document defines the organic search strategy, keyword target matrix, structured data hierarchy, and technical SEO architecture for **Finculator** ([finculator.app](https://finculator.app)).

---

## 1. Technical SEO Foundation

### 1.1 Architecture & Crawlability
- **Static HTML Prerendering**: Every calculator is prerendered to static HTML at root (e.g., `/emi-calculator.html`, `/sip-calculator.html`).
- **Clean Canonical URLs**: Clean extension-less URLs (`https://finculator.app/emi-calculator`) serve as canonical references, mapped seamlessly on Vercel (`cleanUrls: true`), Cloudflare Pages, and local development (`server.py`).
- **Hydration Bridge**: Prerendered HTML provides complete semantic markup, formula explanations, calculation examples, and FAQs for web spiders. When client JavaScript executes, `handleRoute()` seamlessly hydrates interactive state into `#main-content` without layout shift (CLS = 0).
- **Indexable Sitemap**: [sitemap.xml](https://finculator.app/sitemap.xml) includes all 31 prerendered calculator endpoints, updated with `<changefreq>weekly</changefreq>` and priority weighting (1.0 for core calculators, 0.8 for specialized tools).
- **Strict Robots Configuration**: [robots.txt](https://finculator.app/robots.txt) permits complete crawling across search engines (`Googlebot`, `Bingbot`, `Slurp`, `DuckDuckBot`), while disallowing administrative and private API paths (`/api/`, `/data/`).

---

## 2. Structured Data Hierarchy (JSON-LD)

Each calculator page includes three validated schema entities in a unified JSON-LD graph:

1. **`SoftwareApplication`**:
   - `applicationCategory`: `FinanceApplication`
   - `operatingSystem`: `All`
   - `offers`: Free (`price: 0`, `priceCurrency: INR`)
   - `featureList`: Real-time calculation, PDF report generation, zero data retention.

2. **`FAQPage`**:
   - Minimum 2 to 4 high-intent editorial questions and answers covering mathematical formulas, tax implications, and financial decision criteria.
   - Structured specifically for Google SERP rich results / accordion snippets.

3. **`BreadcrumbList`**:
   - Positional navigation markup: Home (`https://finculator.app/`) $\rightarrow$ Suite Category (e.g., `Loans & Mortgages`) $\rightarrow$ Calculator.

---

## 3. Calculator Keyword Target Matrix (27 Core Engines)

| # | Calculator Name | Canonical URL | Primary Target Keyword | Secondary Keywords | Search Intent |
|---|-----------------|---------------|------------------------|--------------------|---------------|
| 1 | EMI Calculator | `/emi-calculator` | `emi calculator` | `loan emi calculator`, `home loan emi`, `monthly emi formula` | Transactional / Tool |
| 2 | Car Loan EMI Calculator | `/car-loan-calculator` | `car loan emi calculator` | `auto loan calculator`, `car emi with down payment` | Transactional / Tool |
| 3 | Home Loan EMI Calculator | `/home-loan-calculator` | `home loan emi calculator` | `housing loan interest calculator`, `mortgage payment schedule` | High Commercial Intent |
| 4 | Personal Loan Calculator | `/personal-loan-calculator` | `personal loan emi calculator` | `instant loan emi`, `unsecured loan calculator` | Commercial / Tool |
| 5 | Education Loan Calculator | `/education-loan-calculator` | `education loan emi calculator` | `student loan repayment`, `moratorium loan calculator` | Informational / Tool |
| 6 | Loan Prepayment Analyzer | `/prepayment-analyzer` | `loan prepayment calculator` | `home loan foreclosure calculator`, `part payment savings` | High Commercial Intent |
| 7 | Loan Comparator | `/loan-comparator` | `compare loan interest rates` | `loan comparison calculator`, `compare emi two banks` | Commercial Investigation |
| 8 | Loan Eligibility & FOIR | `/loan-eligibility-calculator` | `loan eligibility calculator` | `foir calculator`, `how much home loan can i get` | Transactional / Tool |
| 9 | Credit Card Payoff | `/credit-card-payoff-calculator` | `credit card payoff calculator` | `credit card debt reduction`, `minimum payment payoff calculator` | Pain-Point Resolution |
| 10 | Compound Interest | `/compound-interest-calculator` | `compound interest calculator` | `daily compound interest calculator`, `future value calculator` | Informational / Educational |
| 11 | Simple Interest | `/simple-interest-calculator` | `simple interest calculator` | `si calculator`, `simple interest formula calculation` | Educational / Reference |
| 12 | Fixed Deposit (FD) | `/fixed-deposit-calculator` | `fd calculator` | `fixed deposit interest calculator`, `bank fd maturity calculator` | Transactional / Tool |
| 13 | Recurring Deposit (RD) | `/recurring-deposit-calculator` | `rd calculator` | `recurring deposit calculator`, `monthly post office rd returns` | Transactional / Tool |
| 14 | Savings Account Interest | `/savings-account-calculator` | `savings account interest calculator` | `daily balance savings interest`, `section 80tta deduction` | Informational / Tool |
| 15 | SIP Calculator | `/sip-calculator` | `sip calculator` | `mutual fund sip calculator`, `systematic investment plan return` | High Commercial Intent |
| 16 | Step-Up SIP | `/step-up-sip-calculator` | `step up sip calculator` | `top up sip calculator`, `annual increment sip calculator` | High Commercial Intent |
| 17 | Lumpsum Calculator | `/lumpsum-calculator` | `lumpsum calculator` | `mutual fund lumpsum return calculator`, `one time investment return` | Commercial / Tool |
| 18 | CAGR Calculator | `/cagr-calculator` | `cagr calculator` | `compound annual growth rate calculator`, `annualized return calculator`| High Utility / Analytical |
| 19 | PPF Calculator | `/ppf-calculator` | `ppf calculator` | `public provident fund calculator`, `15 year ppf maturity table` | High Volume India |
| 20 | EPF Calculator | `/epf-calculator` | `epf calculator` | `provident fund maturity calculator`, `pf balance calculation` | High Volume India |
| 21 | NPS Calculator | `/nps-calculator` | `nps calculator` | `national pension scheme calculator`, `nps annuity and pension return`| High Intent Retirement |
| 22 | Mutual Fund Returns | `/mutual-fund-calculator` | `mutual fund return calculator` | `expense ratio impact calculator`, `direct vs regular mutual fund` | Commercial Investigation |
| 23 | Stock Return Calculator | `/stock-return-calculator` | `stock return calculator` | `share market profit calculator`, `dividend yield return calculator` | Analytical / Tool |
| 24 | Income Tax Calculator | `/income-tax-calculator` | `income tax calculator fy 2025-26` | `budget 2025 tax calculator`, `new tax regime calculator`, `section 87a rebate` | Ultra High Search Volume |
| 25 | Salary Calculator | `/salary-calculator` | `in hand salary calculator` | `take home pay calculator`, `ctc to in hand calculator india` | High Search Volume |
| 26 | Capital Gains Tax | `/capital-gains-tax-calculator` | `capital gains tax calculator` | `ltcg stcg tax calculator 2025`, `equity capital gains tax` | High Commercial Intent |
| 27 | HRA Exemption | `/hra-calculator` | `hra exemption calculator` | `house rent allowance tax exemption`, `section 10 13a calculation` | High Search Volume |
| 28 | GST Calculator | `/gst-calculator` | `gst calculator` | `gst calculation formula`, `reverse gst calculator`, `cgst sgst split` | High Volume B2B / SME |
| 29 | FIRE Calculator | `/fire-calculator` | `fire calculator` | `financial independence retire early calculator`, `lean fire fat fire calculator`| High Intent Global |
| 30 | Inflation Calculator | `/inflation-calculator` | `inflation calculator india` | `purchasing power calculator`, `future cost of living calculator` | Educational / Planning |
| 31 | Net Worth Calculator | `/net-worth-calculator` | `net worth calculator` | `personal balance sheet calculator`, `liquid net worth tracker` | High Utility / Planning |
| 32 | Budget Planner (50/30/20) | `/budget-planner` | `50 30 20 budget calculator` | `monthly budget planner`, `income expense allocation calculator` | Educational / Planning |
| 33 | Buy vs Rent Calculator | `/buy-vs-rent-calculator` | `buy vs rent calculator` | `rent or buy home calculator`, `real estate opportunity cost calculator`| High Commercial Intent |

---

## 4. Metadata Formula Architecture

Every generated page strictly enforces the following programmatic formula for titles and descriptions:

- **Page Title Formula**:
  `{Calculator Name} — {Key Value Proposition / Core Calculation} | Finculator`
  *(Clamped strictly under 60 characters to prevent SERP truncation).*

- **Meta Description Formula**:
  `Calculate {Primary Output}, {Secondary Breakdown}, and {Actionable Report} with institutional precision. Free, instant & 100% private.`
  *(Clamped strictly between 140 and 158 characters for maximum CTR).*

- **OpenGraph & Twitter Card Standard**:
  - `og:site_name`: `Finculator`
  - `og:type`: `website`
  - `twitter:card`: `summary_large_image`
  - `og:image`: `https://finculator.app/finculator-logo.png`

---

## 5. Google Search Console & Launch Indexing Workflow

### Day 1: Verification & Sitemap Submission
1. Add property `https://finculator.app` via Google Search Console (DNS verification preferred via Cloudflare).
2. Submit `https://finculator.app/sitemap.xml`.
3. Submit `https://finculator.app/robots.txt` via robots testing tool.

### Day 2: High-Volume Priority URL Inspection
Submit URL inspection requests via Search Console API or manual request for the top 5 high-volume seasonal assets:
1. `https://finculator.app/income-tax-calculator` (Budget 2025 search surge)
2. `https://finculator.app/salary-calculator`
3. `https://finculator.app/sip-calculator`
4. `https://finculator.app/emi-calculator`
5. `https://finculator.app/buy-vs-rent-calculator`

### Ongoing Monitoring Metrics
- **Core Web Vitals**: Target 100% "Good" URLs on mobile and desktop (LCP < 2.0s, CLS = 0, INP < 100ms).
- **Coverage**: 0 crawl errors, 0 redirect loops, 0 orphan pages.
- **Rich Results Status**: Verify active recognition of `SoftwareApplication` and `FAQPage` rich snippets.
