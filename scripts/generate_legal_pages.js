/**
 * Finculator Legal & Brand Pages Generator
 * Generates privacy.html, terms.html, disclaimer.html, about.html, contact.html
 * with unified Obsidian Slate design system and accessibility.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFooterHTML } from '../js/components/footer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = 'https://finculator.app';

const LEGAL_PAGES = [
  {
    filename: 'privacy.html',
    title: 'Privacy Policy — Finculator',
    description: 'Read the Finculator privacy policy. 100% client-side calculation privacy, zero forced ad trackers, and transparent data practices.',
    h1: 'Privacy Policy',
    subtitle: 'Transparent, client-first data practices. Last updated: October 24, 2026',
    content: `
      <section class="legal-section">
        <h2>1. The Finculator Privacy Architecture</h2>
        <p>Finculator is engineered on a fundamental principle: <strong>your personal financial calculations belong exclusively to you</strong>. Unlike legacy financial portals and aggregator tools that monetize your loan queries or sell lead data to banks and insurance brokers, Finculator executes all financial calculations entirely on your client device using browser-native JavaScript engines.</p>
      </section>

      <section class="legal-section">
        <h2>2. Calculation Data &amp; Local Storage</h2>
        <p>When you input your salary, home loan balances, mutual fund SIP allocations, or net worth figures into any of our 27 calculators:</p>
        <ul>
          <li><strong>Zero Server Transmission:</strong> Calculation parameters (loan amounts, interest rates, tenures, deductions) are never uploaded to our servers during regular calculator usage.</li>
          <li><strong>Local Persistence:</strong> If you modify calculator inputs, state is saved to your browser's <code>localStorage</code> or <code>sessionStorage</code> exclusively to preserve your working session across page reloads.</li>
          <li><strong>Complete Local Control:</strong> You can clear all cached numbers at any time by clearing your browser cache or clicking "Reset Defaults" on any calculator.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>3. Optional User Accounts &amp; Authentication</h2>
        <p>Creating an account on Finculator is 100% optional. If you choose to register an account to sync personal portfolio goals:</p>
        <ul>
          <li><strong>Password Security:</strong> We enforce strict password complexity rules. Passwords are never stored in plaintext; they are hashed using standard PBKDF2-HMAC-SHA256 with 100,000 computational rounds and unique 16-byte cryptographic salts.</li>
          <li><strong>Minimal Data Collection:</strong> We collect only your email address and encrypted authentication credentials.</li>
          <li><strong>No Third-Party Sharing:</strong> We do not sell, rent, trade, or distribute your account credentials or email address to marketing agencies, loan brokers, or advertisers.</li>
          <li><strong>Account Deletion:</strong> You have the absolute right to terminate your account and delete all associated data at any time by contacting our security team.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>4. FinBot AI Copilot &amp; Proxy Queries</h2>
        <p>Finculator offers an optional AI financial assistant (FinBot). When you submit questions to FinBot:</p>
        <ul>
          <li>Queries are processed through our hardened, rate-limited proxy with strict input length limits (1,000 characters).</li>
          <li>Prompts are checked against a financial Retrieval-Augmented Generation (RAG) knowledge base.</li>
          <li>FinBot operates on an offline rule-based knowledge fallback when no external AI inference provider is configured.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>5. Analytics &amp; Advertising</h2>
        <p>Finculator displays <strong>zero third-party advertisements</strong> and runs <strong>zero cross-site tracking scripts</strong>. We do not use third-party behavioral profiling trackers.</p>
      </section>

      <section class="legal-section">
        <h2>6. Contact &amp; Data Rights</h2>
        <p>If you have any questions regarding this Privacy Policy or wish to exercise data rights, please contact us at <a href="mailto:privacy@finculator.app">privacy@finculator.app</a>.</p>
      </section>
    `
  },
  {
    filename: 'terms.html',
    title: 'Terms of Service — Finculator',
    description: 'Terms of Service governing your use of Finculator financial computation engines, portfolio modeling, and AI tools.',
    h1: 'Terms of Service',
    subtitle: 'Governing terms and conditions for platform usage. Last updated: October 24, 2026',
    content: `
      <section class="legal-section">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Finculator (the "Platform", accessible at <a href="https://finculator.app">https://finculator.app</a>), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the platform immediately.</p>
      </section>

      <section class="legal-section">
        <h2>2. Permitted Use &amp; Intellectual Property</h2>
        <p>Finculator grants you a revocable, non-exclusive, non-transferable license to use its financial calculators, visual charts, and portfolio builder tools for personal, academic, and non-commercial professional analysis.</p>
        <p>The code architecture, layout, brand elements, and custom CSS design system are the intellectual property of Prakhar Rai and the Finculator project contributors. The open-source components of the platform are licensed under the MIT License.</p>
      </section>

      <section class="legal-section">
        <h2>3. Nature of Financial Tools &amp; No Fiduciary Duty</h2>
        <p>Finculator is an independent computation tool. You explicitly acknowledge and agree that:</p>
        <ul>
          <li>The platform does not provide investment advisory, financial planning, legal, accounting, or tax advice.</li>
          <li>No client, advisory, fiduciary, or commercial brokerage relationship is created through your use of the platform.</li>
          <li>Calculations and projections are mathematical approximations based on user-supplied numbers and statutory formulas.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>4. Acceptable Use Policy</h2>
        <p>When using Finculator and its API endpoints, you agree not to:</p>
        <ul>
          <li>Engage in automated scraping, denial-of-service attacks, or excessive query generation that bypasses platform rate limits.</li>
          <li>Attempt to circumvent security controls, authentication mechanisms, or reverse-engineer private API keys.</li>
          <li>Submit malicious payloads, prompt injection attacks, or cross-site scripting (XSS) inputs to the FinBot AI copilot.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>5. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, FINCULATOR AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR EXEMPLARY DAMAGES ARISING FROM YOUR RELIANCE ON ANY COMPUTATION, PROJECTION, TAX ESTIMATE, OR FINANCIAL REPORT GENERATED BY THE PLATFORM.</p>
      </section>

      <section class="legal-section">
        <h2>6. Modifications to Terms</h2>
        <p>We reserve the right to modify these terms at any time. Continued use of the platform following the posting of revised terms constitutes your binding acceptance of the updated terms.</p>
      </section>
    `
  },
  {
    filename: 'disclaimer.html',
    title: 'Financial & Regulatory Disclaimer — Finculator',
    description: 'Comprehensive financial, tax, and regulatory disclaimer for the Finculator suite. Not registered investment advice.',
    h1: 'Financial & Regulatory Disclaimer',
    subtitle: 'Important disclosures regarding computation models and regulatory status',
    content: `
      <section class="legal-section">
        <h2>1. Educational &amp; Illustrative Purposes Only</h2>
        <p>All calculations, amortization tables, wealth growth projections, tax comparisons, and portfolio metrics provided by Finculator are intended strictly for <strong>educational, illustrative, and informational purposes</strong>.</p>
        <p>They should not be construed as, or relied upon as, formal investment advice, tax planning counsel, or an offer or solicitation to buy or sell securities, credit products, or insurance policies.</p>
      </section>

      <section class="legal-section">
        <h2>2. Regulatory Disclosures (SEBI &amp; Banking)</h2>
        <ul>
          <li><strong>Not a SEBI Registered Entity:</strong> Finculator and its author Prakhar Rai are not registered as Investment Advisers (RIA) or Research Analysts with the Securities and Exchange Board of India (SEBI) or any foreign securities regulatory authority.</li>
          <li><strong>Not a Lending Entity:</strong> Finculator is not a bank, Non-Banking Financial Company (NBFC), or authorized credit intermediary. We do not underwrite, sanction, or disburse loans.</li>
          <li><strong>Variable Bank Underwriting:</strong> Actual loan sanctions, processing fees, loan-to-value (LTV) limits, and applicable interest rates are determined exclusively by lending institutions based on your credit score (CIBIL/Experian), income verification, and credit policy.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>3. Tax Calculations &amp; Fiscal Legislation</h2>
        <p>Tax computation engines (including Union Budget 2025 provisions for FY 2025-26 and FY 2024-25, Section 87A rebate rules, marginal relief, standard deductions, HRA exemptions, and capital gains tax brackets) reflect published statutory tax slabs at the time of authoring.</p>
        <p>Tax statutes, surcharge thresholds, and state professional taxes are subject to continuous legislative amendments, judicial interpretations, and circulars issued by the Central Board of Direct Taxes (CBDT). Always consult a licensed Chartered Accountant (CA) or certified tax attorney before filing tax returns or making capital allocation decisions.</p>
      </section>

      <section class="legal-section">
        <h2>4. Investment Risks &amp; Market Volatility</h2>
        <p>Projections in mutual fund SIPs, lumpsum equities, step-up investments, and retirement models rely on user-specified expected annualized rates of return. Mutual fund investments and equities are subject to market risks. Past performance and assumed rates of return do not guarantee future wealth outcomes.</p>
      </section>

      <section class="legal-section">
        <h2>5. Assumption of Risk</h2>
        <p>You assume full responsibility for any financial decisions, loan commitments, prepayment strategies, or investment portfolios executed based on models generated through this platform.</p>
      </section>
    `
  },
  {
    filename: 'about.html',
    title: 'About Finculator — Independent Financial Engineering',
    description: 'Learn why Finculator was built: an independent, ad-free, institutional financial calculation engine with zero tracking and uncompromising precision.',
    h1: 'About Finculator',
    subtitle: 'Institutional financial computation built with engineering rigor and absolute client privacy',
    content: `
      <section class="legal-section">
        <h2>1. The Problem with Modern Financial Portals</h2>
        <p>Most commercial financial calculators on the internet today suffer from the same fundamental conflicts of interest: they are designed as lead-generation magnets. When you calculate a home loan or insurance policy, your data is frequently harvested, packaged, and routed to third-party telemarketers and banks.</p>
        <p>Furthermore, many web calculators rely on oversimplified mathematical formulas that ignore compounding nuances — such as Indian quarterly bank compounding on fixed deposits, Section 87A marginal relief provisos, or negative amortization thresholds on revolving credit cards.</p>
      </section>

      <section class="legal-section">
        <h2>2. The Finculator Philosophy</h2>
        <p>Finculator was architected by software engineer and finance researcher <strong>Prakhar Rai</strong> to prove that modern web engineering can deliver institutional-grade financial tools without compromising user privacy or accuracy.</p>
        <div class="features-grid">
          <div class="feature-item">
            <h3>🔒 100% Client-Side Privacy</h3>
            <p>Every calculation runs in your local browser sandbox. Your income, loan balances, and net worth never touch our servers unless you explicitly create an account.</p>
          </div>
          <div class="feature-item">
            <h3>📐 Verified Mathematical Rigor</h3>
            <p>27 specialized financial engines calibrated against Reserve Bank of India (RBI) conventions, SBI compounding guidelines, and Union Budget 2025 tax code.</p>
          </div>
          <div class="feature-item">
            <h3>🚫 Zero Ads &amp; Zero Trackers</h3>
            <p>Clean, distraction-free Obsidian Slate dark theme. No popups, no affiliate redirection traps, and no invasive third-party ad networks.</p>
          </div>
          <div class="feature-item">
            <h3>⚡ Instant Performance</h3>
            <p>Self-hosted WOFF2 typography, zero bloat, and sub-second execution with print-ready PDF export capabilities.</p>
          </div>
        </div>
      </section>

      <section class="legal-section">
        <h2>3. The 27 Financial Computation Engines</h2>
        <p>Finculator covers five primary domains of personal and commercial capital management:</p>
        <ul>
          <li><strong>Loans &amp; Mortgages (5):</strong> Reducing Balance EMI, Loan Prepayment Analyzer, Multi-Bank Comparator, Loan Eligibility &amp; FOIR, Credit Card Payoff &amp; Negative Amortization.</li>
          <li><strong>Savings &amp; Deposits (5):</strong> Compound Interest, Simple Interest, Fixed Deposit (Quarterly Compounding), Recurring Deposit (RD), High-Yield Savings Account.</li>
          <li><strong>Wealth &amp; Investing (9):</strong> Systematic Investment Plan (SIP), Step-Up SIP, Lumpsum Mutual Funds, CAGR &amp; Absolute Return, PPF (15-Year EEE), EPF Corpus, NPS Pension &amp; Annuity, Mutual Fund Expense Drag, Stock Return &amp; Dividend Yield.</li>
          <li><strong>Tax &amp; Business (5):</strong> Income Tax (Budget 2025 FY 2025-26 &amp; FY 2024-25), Take-Home In-Hand Salary, Capital Gains Tax (LTCG / STCG), HRA Section 10(13A) Exemption, GST Inclusive &amp; Exclusive.</li>
          <li><strong>Long-Term Planning (5):</strong> FIRE (Financial Independence, Retire Early), Inflation &amp; Purchasing Power, Net Worth Balance Sheet, 50/30/20 Budget Planner, Buy vs Rent Real Estate Decision Engine.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>4. Open Source &amp; Architecture</h2>
        <p>Finculator is built with vanilla JavaScript (ES modules), clean modern CSS, and automated testing suites. View our source code, contribute, or audit the implementation on <a href="https://github.com/prakharrai12/finculator" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
      </section>
    `
  },
  {
    filename: 'contact.html',
    title: 'Contact & Security — Finculator',
    description: 'Get in touch with the Finculator engineering team. Report security vulnerabilities, submit feature feedback, or connect with the author.',
    h1: 'Contact & Security',
    subtitle: 'Direct communication channels for users, researchers, and financial professionals',
    content: `
      <section class="legal-section">
        <h2>1. General Inquiries &amp; Feedback</h2>
        <p>Have feedback, found a formula discrepancy, or want to suggest a new financial calculator? We welcome inquiries from developers, financial advisors, and active users.</p>
        <p><strong>Email:</strong> <a href="mailto:contact@finculator.app">contact@finculator.app</a></p>
      </section>

      <section class="legal-section">
        <h2>2. Responsible Security Disclosure</h2>
        <p>We take software security and user privacy seriously. If you discover a security vulnerability, authentication bug, or potential data leak:</p>
        <ul>
          <li>Please email our security desk directly at <a href="mailto:security@finculator.app">security@finculator.app</a>.</li>
          <li>Include detailed steps to reproduce the issue and allow reasonable time for remediation prior to public disclosure.</li>
          <li>Review our <a href="https://github.com/prakharrai12/finculator/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">SECURITY.md</a> policy on GitHub for our full vulnerability reporting guidelines.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>3. Developer &amp; Repository</h2>
        <p>Finculator is maintained by <strong>Prakhar Rai</strong>.</p>
        <ul>
          <li><strong>GitHub Repository:</strong> <a href="https://github.com/prakharrai12/finculator" target="_blank" rel="noopener noreferrer">github.com/prakharrai12/finculator</a></li>
          <li><strong>Bug Reports &amp; Issues:</strong> <a href="https://github.com/prakharrai12/finculator/issues" target="_blank" rel="noopener noreferrer">github.com/prakharrai12/finculator/issues</a></li>
        </ul>
      </section>
    `
  }
];

function buildLegalPageHTML(page) {
  const footerHtml = getFooterHTML();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page.title}</title>
  <meta name="description" content="${page.description}" />
  <link rel="canonical" href="${BASE_URL}/${page.filename}" />

  <!-- Self-Hosted Modern WOFF2 Fonts (Zero Third-Party Latency) -->
  <link rel="preload" href="fonts/inter-normal-400-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="fonts/fraunces-normal-600-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="css/fonts.css" />

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="docs/images/favicon.png" />

  <!-- Stylesheets -->
  <link rel="stylesheet" href="css/main.css?v=4.5" />
  <link rel="stylesheet" href="css/components.css?v=4.5" />
  <link rel="stylesheet" href="css/calculators.css?v=4.5" />
  <link rel="stylesheet" href="css/landingGate.css?v=4.5" />

  <!-- OpenGraph & Twitter Meta Tags -->
  <meta property="og:site_name" content="Finculator" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:url" content="${BASE_URL}/${page.filename}" />
  <meta property="og:image" content="${BASE_URL}/docs/images/finculator-logo.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${page.title}" />
  <meta name="twitter:description" content="${page.description}" />
  <meta name="twitter:image" content="${BASE_URL}/docs/images/finculator-logo.png" />

  <style>
    .legal-page-container {
      max-width: 860px;
      margin: 2.5rem auto 4rem auto;
      padding: 0 1.5rem;
    }
    .legal-header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 2rem;
    }
    .legal-breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      color: #94A3B8;
      margin-bottom: 1.25rem;
    }
    .legal-breadcrumb a {
      color: #38BDF8;
      text-decoration: none;
    }
    .legal-breadcrumb a:hover {
      text-decoration: underline;
    }
    .legal-title {
      font-family: 'Fraunces', serif;
      font-size: 2.4rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.02em;
      margin: 0 0 0.75rem 0;
    }
    .legal-subtitle {
      font-size: 1rem;
      color: #94A3B8;
      margin: 0;
      line-height: 1.5;
    }
    .legal-content {
      color: #CBD5E1;
      font-size: 0.95rem;
      line-height: 1.75;
    }
    .legal-section {
      margin-bottom: 2.5rem;
    }
    .legal-section h2 {
      font-family: 'Fraunces', serif;
      font-size: 1.35rem;
      font-weight: 600;
      color: #F8FAFC;
      margin: 0 0 1rem 0;
      letter-spacing: -0.01em;
    }
    .legal-section p {
      margin: 0 0 1rem 0;
      color: #CBD5E1;
    }
    .legal-section ul {
      margin: 0 0 1.25rem 1.25rem;
      padding: 0;
    }
    .legal-section li {
      margin-bottom: 0.6rem;
      color: #CBD5E1;
    }
    .legal-section a {
      color: #38BDF8;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .legal-section a:hover {
      color: #7DD3FC;
    }
    .legal-section code {
      background: rgba(255, 255, 255, 0.08);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.85em;
      color: #93C5FD;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin: 1.5rem 0;
    }
    .feature-item {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .feature-item h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: #F8FAFC;
      margin: 0 0 0.5rem 0;
    }
    .feature-item p {
      font-size: 0.88rem;
      color: #94A3B8;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-to-content">Skip to main content</a>
  <div class="app-container">
    <!-- Top Header Bar -->
    <header class="app-header">
      <div class="header-left">
        <a href="/" class="brand-mark" title="FINCULATOR — Smart Decisions. Stronger Futures.">
          <div class="brand-logo-wrap">
            <img src="docs/images/finculator-icon.png" alt="Finculator Official Logo" class="brand-logo-img" width="38" height="38" />
          </div>
          <div class="brand-info">
            <span class="brand-title"><span class="brand-title-blue">FIN</span>CULATOR</span>
            <span class="brand-tagline">Smart Decisions. Stronger Futures.</span>
          </div>
        </a>
      </div>

      <div class="header-actions">
        <a href="/" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Explore All 27 Calculators
        </a>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-content" id="main-content" role="main">
      <div class="legal-page-container">
        <div class="legal-header">
          <nav class="legal-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <span>${page.h1}</span>
          </nav>
          <h1 class="legal-title">${page.h1}</h1>
          <p class="legal-subtitle">${page.subtitle}</p>
        </div>

        <div class="legal-content">
          ${page.content}
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer" id="app-footer">
      ${footerHtml}
    </footer>
  </div>
</body>
</html>`;
}

console.log('--- Generating Finculator Legal & Brand Pages ---');
for (const page of LEGAL_PAGES) {
  const filePath = path.join(ROOT_DIR, page.filename);
  const html = buildLegalPageHTML(page);
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`[OK] Generated ${page.filename}`);
}
