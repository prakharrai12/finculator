/**
 * Finculator Institutional Portfolio PDF & Statement Generator
 * Generates an advisory-grade Personal Financial Statement (PFS) & Wealth Portfolio Report
 */

import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { calculatePortfolioMetrics } from '../math/portfolioMath.js';

/**
 * Generate and launch the print / PDF export window for the portfolio
 * @param {object} portfolioState 
 */
export function generatePortfolioPDF(portfolioState) {
  try {
    sessionStorage.setItem('finculator_downloaded_pdf', 'true');
  } catch (_) {}

  const metrics = calculatePortfolioMetrics(portfolioState);
  const profile = portfolioState.profile || {};
  const assets = portfolioState.assets || {};
  const liab = portfolioState.liabilities || {};
  const inc = portfolioState.income || {};
  const exp = portfolioState.expenses || {};
  const insurance = portfolioState.insurance || {};
  const estate = portfolioState.estate || {};
  const credit = portfolioState.credit || {};
  const curr = getGlobalCurrency();

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download your institutional PDF statement.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Finculator Personal Financial Statement — ${profile.fullName || 'Client Portfolio'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      line-height: 1.45;
      font-size: 8.5pt;
      padding: 0;
    }

    .report-container {
      max-width: 100%;
      margin: 0 auto;
    }

    /* Header Bar */
    .report-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2pt solid #0F172A;
      padding-bottom: 8pt;
      margin-bottom: 12pt;
    }

    .brand-group h1 {
      font-family: 'Fraunces', serif;
      font-size: 16pt;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }

    .brand-group p {
      font-size: 7.5pt;
      color: #64748B;
      font-weight: 500;
    }

    .meta-group {
      text-align: right;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 7.5pt;
      color: #475569;
    }

    .meta-group strong {
      color: #0F172A;
    }

    /* Client Profile Card */
    .profile-card {
      background: #F8FAFC;
      border: 1pt solid #E2E8F0;
      border-radius: 4pt;
      padding: 8pt 10pt;
      margin-bottom: 12pt;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6pt;
      font-size: 8pt;
    }

    .profile-item span {
      display: block;
      font-size: 6.8pt;
      text-transform: uppercase;
      color: #64748B;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .profile-item strong {
      font-weight: 600;
      color: #0F172A;
    }

    /* Hero Net Worth Box */
    .hero-box {
      background: #0F172A;
      color: #FFFFFF;
      border-radius: 4pt;
      padding: 10pt 14pt;
      margin-bottom: 14pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .hero-left span {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94A3B8;
      display: block;
    }

    .hero-left h2 {
      font-family: 'Fraunces', serif;
      font-size: 22pt;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.1;
    }

    .hero-stats {
      display: flex;
      gap: 16pt;
      text-align: right;
    }

    .hero-stat span {
      font-size: 6.8pt;
      color: #94A3B8;
      text-transform: uppercase;
      display: block;
    }

    .hero-stat strong {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11pt;
      color: #FFFFFF;
    }

    /* Grid for Tables */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
      margin-bottom: 12pt;
    }

    /* Section Headings */
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0F172A;
      border-bottom: 1pt solid #CBD5E1;
      padding-bottom: 3pt;
      margin-bottom: 6pt;
      display: flex;
      justify-content: space-between;
    }

    .section-title span {
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 600;
      color: #475569;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
      margin-bottom: 6pt;
    }

    th {
      background: #F1F5F9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 3pt 5pt;
      border-bottom: 1pt solid #CBD5E1;
      font-size: 7pt;
      text-transform: uppercase;
    }

    td {
      padding: 3pt 5pt;
      border-bottom: 0.5pt solid #E2E8F0;
      color: #1E293B;
    }

    td.num, th.num {
      text-align: right;
      font-family: 'IBM Plex Mono', monospace;
    }

    tr.total-row td {
      font-weight: 700;
      border-top: 1pt solid #94A3B8;
      border-bottom: 1pt solid #0F172A;
      background: #F8FAFC;
    }

    /* Footer Disclaimer */
    .report-footer {
      margin-top: 14pt;
      border-top: 1pt solid #CBD5E1;
      padding-top: 6pt;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
      color: #64748B;
    }

    .print-btn-bar {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #0F172A;
      color: #FFFFFF;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 9pt;
      font-weight: 600;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
    }

    @media print {
      .print-btn-bar { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <button class="print-btn-bar" onclick="window.print()">Print / Save PDF</button>

  <div class="report-container">
    <!-- Header -->
    <div class="report-header">
      <div class="brand-group">
        <h1>FINCULATOR</h1>
        <p>Institutional Personal Financial Statement & Investment Portfolio Report</p>
      </div>
      <div class="meta-group">
        <div>Statement Date: <strong>${profile.asOfDate || new Date().toISOString().split('T')[0]}</strong></div>
        <div>Reporting Currency: <strong>${curr.code} (${curr.symbol})</strong></div>
        <div>Document Ref: <strong>FIN-${Date.now().toString().slice(-6)}</strong></div>
      </div>
    </div>

    <!-- Client Profile -->
    <div class="profile-card">
      <div class="profile-item">
        <span>Full Name</span>
        <strong>${profile.fullName || 'N/A'}</strong>
      </div>
      <div class="profile-item">
        <span>Occupation / Employer</span>
        <strong>${profile.occupation || 'Professional'} (${profile.employer || 'Private'})</strong>
      </div>
      <div class="profile-item">
        <span>Contact Email / Phone</span>
        <strong>${profile.email || 'N/A'} | ${profile.phone || 'N/A'}</strong>
      </div>
      <div class="profile-item">
        <span>Credit Score & Status</span>
        <strong>${credit.creditScore || '785'} (Prime Tier)</strong>
      </div>
    </div>

    <!-- Hero Net Worth -->
    <div class="hero-box">
      <div class="hero-left">
        <span>Consolidated Personal Net Worth</span>
        <h2>${formatCurrency(metrics.netWorth)}</h2>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <span>Total Assets</span>
          <strong>${formatCurrency(metrics.totalAssets)}</strong>
        </div>
        <div class="hero-stat">
          <span>Total Liabilities</span>
          <strong>${formatCurrency(metrics.totalLiabilities)}</strong>
        </div>
        <div class="hero-stat">
          <span>Liquid Solvency</span>
          <strong>${formatCurrency(metrics.liquidNetWorth)}</strong>
        </div>
        <div class="hero-stat">
          <span>Debt-to-Asset</span>
          <strong>${metrics.debtToAssetRatio}%</strong>
        </div>
      </div>
    </div>

    <!-- Balance Sheet: Assets & Liabilities -->
    <div class="two-col-grid">
      <!-- Assets Table -->
      <div>
        <div class="section-title">
          <span>Asset Inventory</span>
          <span>Total: ${formatCurrency(metrics.totalAssets)}</span>
        </div>
        <table>
          <thead>
            <tr><th>Asset Class</th><th class="num">Market Value</th></tr>
          </thead>
          <tbody>
            <tr><td>Liquid Cash & Savings Accounts</td><td class="num">${formatCurrency(metrics.liquidAssets)}</td></tr>
            <tr><td>Fixed Deposits & Term Deposits</td><td class="num">${formatCurrency(metrics.fixedDepositAssets)}</td></tr>
            <tr><td>Stocks, Mutual Funds & Equities</td><td class="num">${formatCurrency(metrics.marketInvestments)}</td></tr>
            <tr><td>Retirement Accounts (EPF/PPF/NPS)</td><td class="num">${formatCurrency(metrics.retirementAssets)}</td></tr>
            <tr><td>Primary Real Estate Residence</td><td class="num">${formatCurrency(assets.primaryResidence || 0)}</td></tr>
            <tr><td>Investment Properties</td><td class="num">${formatCurrency(assets.investmentProperties || 0)}</td></tr>
            <tr><td>Vehicles (Market Resale)</td><td class="num">${formatCurrency(metrics.vehicleAssets)}</td></tr>
            <tr><td>Personal Valuables & Jewelry</td><td class="num">${formatCurrency(metrics.valuableAssets)}</td></tr>
            <tr><td>Life Insurance Cash Surrender Value</td><td class="num">${formatCurrency(assets.lifeInsuranceCashValue || 0)}</td></tr>
            <tr class="total-row"><td>TOTAL ASSETS (A)</td><td class="num">${formatCurrency(metrics.totalAssets)}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Liabilities Table -->
      <div>
        <div class="section-title">
          <span>Liabilities & Debts</span>
          <span>Total: ${formatCurrency(metrics.totalLiabilities)}</span>
        </div>
        <table>
          <thead>
            <tr><th>Liability Category</th><th class="num">Outstanding Balance</th></tr>
          </thead>
          <tbody>
            <tr><td>Credit Card Revolving Balances</td><td class="num">${formatCurrency(liab.creditCards || 0)}</td></tr>
            <tr><td>Primary Mortgage / Home Loan</td><td class="num">${formatCurrency(liab.mortgagePrimary || 0)}</td></tr>
            <tr><td>Investment Property Loan</td><td class="num">${formatCurrency(liab.mortgageInvestment || 0)}</td></tr>
            <tr><td>Auto Vehicle Loans</td><td class="num">${formatCurrency(liab.autoLoans || 0)}</td></tr>
            <tr><td>Student & Education Loans</td><td class="num">${formatCurrency(liab.studentLoans || 0)}</td></tr>
            <tr><td>Personal Loans / Lines of Credit</td><td class="num">${formatCurrency(liab.personalLoans || 0)}</td></tr>
            <tr><td>Unpaid Taxes / Outstanding Owed</td><td class="num">${formatCurrency(liab.unpaidTaxes || 0)}</td></tr>
            <tr class="total-row"><td>TOTAL LIABILITIES (B)</td><td class="num">${formatCurrency(metrics.totalLiabilities)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Monthly Cash Flow & Investment Ledger -->
    <div class="two-col-grid">
      <!-- Cash Flow -->
      <div>
        <div class="section-title">
          <span>Monthly Cash Flow & Surplus</span>
          <span>Savings Rate: ${metrics.savingsRatePct}%</span>
        </div>
        <table>
          <thead>
            <tr><th>Income & Expense Stream</th><th class="num">Monthly Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Primary Salary (Net In-Hand)</td><td class="num">${formatCurrency(inc.primarySalary || 0)}</td></tr>
            <tr><td>Secondary & Business Income</td><td class="num">${formatCurrency((inc.secondarySalary || 0) + (inc.businessIncome || 0))}</td></tr>
            <tr><td>Dividends, Interest & Rental</td><td class="num">${formatCurrency((inc.dividendsInterest || 0) + (inc.rentalIncome || 0))}</td></tr>
            <tr style="background:#F1F5F9; font-weight:600;"><td>Total Gross Monthly Inflow</td><td class="num">${formatCurrency(metrics.totalMonthlyIncome)}</td></tr>
            <tr><td>Fixed Living Costs (Rent/Bills)</td><td class="num">${formatCurrency(exp.fixedLiving || 0)}</td></tr>
            <tr><td>Variable Lifestyle & Discretionary</td><td class="num">${formatCurrency(exp.variableDiscretionary || 0)}</td></tr>
            <tr><td>Monthly Debt Servicing / EMIs</td><td class="num">${formatCurrency(exp.debtPayments || 0)}</td></tr>
            <tr class="total-row"><td>NET MONTHLY SURPLUS (Inflow − Outflow)</td><td class="num">${formatCurrency(metrics.monthlyNetSurplus)}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Protection & Solvency -->
      <div>
        <div class="section-title">
          <span>Risk Protection & Emergency Runway</span>
          <span>Runway: ${metrics.emergencyRunwayMonths} Mo</span>
        </div>
        <table>
          <thead>
            <tr><th>Coverage Dimension</th><th class="num">Amount / Metric</th></tr>
          </thead>
          <tbody>
            <tr><td>Term Life Insurance Sum Assured</td><td class="num">${formatCurrency(insurance.lifeCoverage || 0)}</td></tr>
            <tr><td>Health Insurance Coverage</td><td class="num">${formatCurrency(insurance.healthCoverage || 0)}</td></tr>
            <tr><td>Annual Insurance Total Premiums</td><td class="num">${formatCurrency((insurance.lifePremium || 0) + (insurance.healthPremium || 0))}</td></tr>
            <tr><td>Emergency Reserve Available</td><td class="num">${formatCurrency(metrics.liquidAssets)}</td></tr>
            <tr><td>Recommended 6-Mo Emergency Target</td><td class="num">${formatCurrency(metrics.emergencyRecommended)}</td></tr>
            <tr><td>Debt-to-Income (DTI) Ratio</td><td class="num">${metrics.debtToIncomeRatio}%</td></tr>
            <tr class="total-row"><td>EMERGENCY RUNWAY STATUS</td><td class="num">${metrics.emergencyRunwayMonths} Months</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Individual Investment Holdings Ledger -->
    ${metrics.processedHoldings && metrics.processedHoldings.length > 0 ? `
    <div style="margin-bottom: 12pt;">
      <div class="section-title">
        <span>Investment Portfolio Holdings Ledger</span>
        <span>Portfolio Value: ${formatCurrency(metrics.totalHoldingsValue)} (Gain/Loss: ${formatCurrency(metrics.totalHoldingsGainLoss)})</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Security / Fund Name</th>
            <th>Type</th>
            <th class="num">Quantity</th>
            <th class="num">Buy Price</th>
            <th class="num">Current Price</th>
            <th class="num">Market Value</th>
            <th class="num">Weight %</th>
            <th class="num">Gain / Loss</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.processedHoldings.map((h) => `
            <tr>
              <td><strong>${h.name}</strong></td>
              <td>${h.type}</td>
              <td class="num">${h.qty}</td>
              <td class="num">${formatCurrency(h.buyPrice)}</td>
              <td class="num">${formatCurrency(h.currentPrice)}</td>
              <td class="num"><strong>${formatCurrency(h.value)}</strong></td>
              <td class="num">${h.weightPct}%</td>
              <td class="num" style="color: ${h.gainLoss >= 0 ? '#10B981' : '#F87171'}; font-weight:600;">
                ${h.gainLoss >= 0 ? '+' : ''}${formatCurrency(h.gainLoss)} (${h.gainLossPct}%)
              </td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="5">TOTAL INVESTMENT HOLDINGS VALUATION</td>
            <td class="num"><strong>${formatCurrency(metrics.totalHoldingsValue)}</strong></td>
            <td class="num">100%</td>
            <td class="num" style="color: ${metrics.totalHoldingsGainLoss >= 0 ? '#10B981' : '#F87171'};">
              ${metrics.totalHoldingsGainLoss >= 0 ? '+' : ''}${formatCurrency(metrics.totalHoldingsGainLoss)} (${metrics.totalHoldingsGainLossPct}%)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Financial Goals & Progress -->
    ${portfolioState.goals && portfolioState.goals.length > 0 ? `
    <div style="margin-bottom: 10pt;">
      <div class="section-title">
        <span>Strategic Financial Goals & Target Milestones</span>
        <span>Active Goals: ${portfolioState.goals.length}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Goal Name</th>
            <th>Horizon</th>
            <th class="num">Target Amount</th>
            <th class="num">Current Accumulated</th>
            <th class="num">Target Year</th>
            <th class="num">Completion %</th>
          </tr>
        </thead>
        <tbody>
          ${portfolioState.goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round(((g.currentAmount || 0) / g.targetAmount) * 100)) : 0;
            return `
              <tr>
                <td><strong>${g.title}</strong></td>
                <td>${g.type}</td>
                <td class="num">${formatCurrency(g.targetAmount)}</td>
                <td class="num">${formatCurrency(g.currentAmount || 0)}</td>
                <td class="num">${g.targetDate || '2030'}</td>
                <td class="num"><strong>${pct}%</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Disclaimer & Advisory Notice -->
    <div class="report-footer">
      <div>Generated by Finculator Financial Intelligence Engine &bull; https://finculator.app</div>
      <div>Confidential &bull; This document is a self-reported financial statement for informational and planning purposes.</div>
    </div>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
