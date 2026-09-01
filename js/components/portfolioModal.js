/**
 * Finculator Personal Finance Portfolio Builder Modal & Controller
 * Merges Personal Financial Statement (PFS) & Wealth Management Portfolio Report
 */

import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from './charts.js';
import { DEFAULT_PORTFOLIO_STATE, calculatePortfolioMetrics } from '../math/portfolioMath.js';
import { generatePortfolioPDF } from './portfolioPDF.js';

export class PortfolioModal {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.state = getStoredState('personal_portfolio', DEFAULT_PORTFOLIO_STATE);
    this.saveTimeout = null;

    this.initDOM();
    this.attachEvents();
  }

  initDOM() {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'portfolio-backdrop';
    this.backdrop.id = 'portfolio-drawer-backdrop';

    // Drawer Container
    this.drawer = document.createElement('div');
    this.drawer.className = 'portfolio-drawer';
    this.drawer.id = 'portfolio-drawer';

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.drawer);

    this.render();
  }

  render() {
    const metrics = calculatePortfolioMetrics(this.state);
    const profile = this.state.profile || {};
    const assets = this.state.assets || {};
    const liab = this.state.liabilities || {};
    const inc = this.state.income || {};
    const exp = this.state.expenses || {};
    const insurance = this.state.insurance || {};
    const goals = this.state.goals || [];
    const estate = this.state.estate || {};
    const credit = this.state.credit || {};
    const curr = getGlobalCurrency();

    this.drawer.innerHTML = `
      <!-- Header Bar -->
      <div class="portfolio-header">
        <div class="portfolio-header-left">
          <div class="portfolio-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div class="portfolio-title-group">
            <h2>Personal Finance Portfolio & Statement</h2>
            <p>Comprehensive Balance Sheet, Asset Allocation & Net Worth Ledger</p>
          </div>
        </div>

        <div class="portfolio-header-actions">
          <span class="portfolio-save-status" id="pf-save-badge">✓ Saved</span>
          <button class="btn btn-secondary btn-sm" id="pf-btn-reset" title="Reset to Defaults">Reset Defaults</button>
          <button class="btn btn-primary btn-sm" id="pf-btn-download-pdf">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download PDF
          </button>
          <button class="portfolio-btn-close" id="pf-btn-close" title="Close Portfolio">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Scrollable Workspace -->
      <div class="portfolio-workspace">
        <!-- Hero Net Worth Card -->
        <div class="portfolio-hero-card">
          <div class="portfolio-hero-top">
            <div class="portfolio-hero-main-stat">
              <span class="portfolio-hero-label">Consolidated Net Worth</span>
              <span class="portfolio-hero-value" id="pf-hero-nw">${formatCurrency(metrics.netWorth)}</span>
              <span class="portfolio-hero-sub" id="pf-hero-sub">
                Total Assets (${formatCurrency(metrics.totalAssets)}) − Total Liabilities (${formatCurrency(metrics.totalLiabilities)})
              </span>
            </div>
            <div class="portfolio-hero-quick-actions">
              <button class="btn btn-secondary btn-sm" id="pf-btn-print-hero">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Export Report
              </button>
            </div>
          </div>

          <!-- Supporting 6-Metric Stat Grid -->
          <div class="portfolio-stat-grid">
            <div class="portfolio-stat-box">
              <span class="portfolio-stat-lbl">Total Assets</span>
              <span class="portfolio-stat-val positive" id="pf-stat-assets">${formatCurrency(metrics.totalAssets)}</span>
              <span class="portfolio-stat-desc">Everything owned</span>
            </div>
            <div class="portfolio-stat-box">
              <span class="portfolio-stat-lbl">Total Liabilities</span>
              <span class="portfolio-stat-val negative" id="pf-stat-liab">${formatCurrency(metrics.totalLiabilities)}</span>
              <span class="portfolio-stat-desc">Outstanding debts</span>
            </div>
            <div class="portfolio-stat-box">
              <span class="portfolio-stat-lbl">Liquid Solvency</span>
              <span class="portfolio-stat-val highlight" id="pf-stat-liquid">${formatCurrency(metrics.liquidNetWorth)}</span>
              <span class="portfolio-stat-desc">Cash + MFs − Short debt</span>
            </div>
            <div class="portfolio-stat-box">
              <span class="portfolio-stat-lbl">Monthly Cash Surplus</span>
              <span class="portfolio-stat-val ${metrics.monthlyNetSurplus >= 0 ? 'positive' : 'negative'}" id="pf-stat-surplus">${formatCurrency(metrics.monthlyNetSurplus)}</span>
              <span class="portfolio-stat-desc">Savings Rate: <strong id="pf-stat-sav-rate">${metrics.savingsRatePct}%</strong></span>
            </div>
            <div class="portfolio-stat-box">
              <span class="portfolio-stat-lbl">Debt-to-Income (DTI)</span>
              <span class="portfolio-stat-val" id="pf-stat-dti">${metrics.debtToIncomeRatio}%</span>
              <span class="portfolio-stat-desc">Monthly EMI burden</span>
            </div>
            <div class="portfolio-stat-box">
              <span class="portfolio-stat-lbl">Emergency Runway</span>
              <span class="portfolio-stat-val highlight" id="pf-stat-runway">${metrics.emergencyRunwayMonths} Mo</span>
              <span class="portfolio-stat-desc">Target: 6 Months</span>
            </div>
          </div>
        </div>

        <!-- 2-Column Responsive Workspace Grid -->
        <div class="portfolio-main-grid">
          <!-- Left Column: Stepped Accordion Form -->
          <div class="portfolio-accordion">
            <!-- 1. Personal & Identification Details -->
            <div class="portfolio-acc-item active" data-acc="profile">
              <div class="portfolio-acc-header">
                <div class="portfolio-acc-title-wrap">
                  <span class="portfolio-acc-number">1</span>
                  <span class="portfolio-acc-title">Personal & Identification Details</span>
                </div>
                <div class="portfolio-acc-meta">
                  <span class="portfolio-acc-sum" id="pf-sum-profile">${profile.fullName || 'Profile'}</span>
                  <svg class="portfolio-acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="portfolio-acc-body">
                <div class="portfolio-form-grid">
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Full Legal Name</label>
                    <input type="text" class="portfolio-field-input" id="pf-prof-name" placeholder="John Doe" value="${profile.fullName || ''}" />
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Date of Birth</label>
                    <input type="date" class="portfolio-field-input" id="pf-prof-dob" value="${profile.dob || '1995-08-15'}" />
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Email Address</label>
                    <input type="email" class="portfolio-field-input" id="pf-prof-email" placeholder="john@example.com" value="${profile.email || ''}" />
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Phone Number</label>
                    <input type="text" class="portfolio-field-input" id="pf-prof-phone" placeholder="+91 9876543210" value="${profile.phone || ''}" />
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Occupation / Title</label>
                    <input type="text" class="portfolio-field-input" id="pf-prof-occ" placeholder="Tech Lead / Consultant" value="${profile.occupation || ''}" />
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Employer / Organization</label>
                    <input type="text" class="portfolio-field-input" id="pf-prof-emp" placeholder="Company Name" value="${profile.employer || ''}" />
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Statement "As of" Date</label>
                    <input type="date" class="portfolio-field-input" id="pf-prof-date" value="${profile.asOfDate || new Date().toISOString().split('T')[0]}" />
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Number of Dependents</label>
                    <input type="number" class="portfolio-field-input" id="pf-prof-dep" min="0" max="20" placeholder="0" value="${profile.dependents || 0}" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Asset Inventory -->
            <div class="portfolio-acc-item" data-acc="assets">
              <div class="portfolio-acc-header">
                <div class="portfolio-acc-title-wrap">
                  <span class="portfolio-acc-number">2</span>
                  <span class="portfolio-acc-title">Asset Inventory (Everything Owned)</span>
                </div>
                <div class="portfolio-acc-meta">
                  <span class="portfolio-acc-sum" id="pf-sum-assets">Total: ${formatCurrency(metrics.totalAssets)}</span>
                  <svg class="portfolio-acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="portfolio-acc-body">
                <div class="portfolio-form-grid">
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Checking & Liquid Cash</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-cash" placeholder="0" value="${assets.cashChecking || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Savings Accounts</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-savings" placeholder="0" value="${assets.savingsAccounts || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Fixed Deposits & CDs</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-fd" placeholder="0" value="${assets.fixedDeposits || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Stocks & Direct Equities</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-stocks" placeholder="0" value="${assets.stocksEquities || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Mutual Funds & ETFs</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-mf" placeholder="0" value="${assets.mutualFundsETFs || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Retirement (EPF, PPF, NPS, 401k)</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-ret" placeholder="0" value="${assets.retirementAccounts || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Primary Real Estate (Market Value)</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-re-pri" placeholder="0" value="${assets.primaryResidence || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Vehicles (Market Resale Value)</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-veh" placeholder="0" value="${assets.vehicles || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Valuables, Jewelry & Gold</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-val" placeholder="0" value="${assets.valuablesArtJewelry || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Insurance Cash Surrender Value</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ast-ins-csv" placeholder="0" value="${assets.lifeInsuranceCashValue || 0}" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Liabilities & Debts -->
            <div class="portfolio-acc-item" data-acc="liabilities">
              <div class="portfolio-acc-header">
                <div class="portfolio-acc-title-wrap">
                  <span class="portfolio-acc-number">3</span>
                  <span class="portfolio-acc-title">Liabilities & Outstanding Debts</span>
                </div>
                <div class="portfolio-acc-meta">
                  <span class="portfolio-acc-sum" id="pf-sum-liab">Total: ${formatCurrency(metrics.totalLiabilities)}</span>
                  <svg class="portfolio-acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="portfolio-acc-body">
                <div class="portfolio-form-grid">
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Credit Card Revolving Balances</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-liab-cc" placeholder="0" value="${liab.creditCards || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Primary Mortgage / Home Loan Balance</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-liab-mort" placeholder="0" value="${liab.mortgagePrimary || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Auto / Vehicle Loans</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-liab-auto" placeholder="0" value="${liab.autoLoans || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Student & Personal Loans</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-liab-pers" placeholder="0" value="${liab.personalLoans || 0}" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Monthly Cash Flow -->
            <div class="portfolio-acc-item" data-acc="cashflow">
              <div class="portfolio-acc-header">
                <div class="portfolio-acc-title-wrap">
                  <span class="portfolio-acc-number">4</span>
                  <span class="portfolio-acc-title">Monthly Cash Flow (Income & Expenses)</span>
                </div>
                <div class="portfolio-acc-meta">
                  <span class="portfolio-acc-sum" id="pf-sum-cashflow">Surplus: ${formatCurrency(metrics.monthlyNetSurplus)}/mo</span>
                  <svg class="portfolio-acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="portfolio-acc-body">
                <div class="portfolio-form-grid">
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Primary Net Monthly Salary</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-inc-salary" placeholder="0" value="${inc.primarySalary || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Dividends & Secondary Inflow</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-inc-sec" placeholder="0" value="${inc.dividendsInterest || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Fixed Living Costs (Rent/Utilities/Bills)</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-exp-fixed" placeholder="0" value="${exp.fixedLiving || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Discretionary / Lifestyle Expenses</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-exp-var" placeholder="0" value="${exp.variableDiscretionary || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Monthly Debt Repayments (EMIs)</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-exp-debt" placeholder="0" value="${exp.debtPayments || 0}" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. Investment Holdings Ledger -->
            <div class="portfolio-acc-item" data-acc="holdings">
              <div class="portfolio-acc-header">
                <div class="portfolio-acc-title-wrap">
                  <span class="portfolio-acc-number">5</span>
                  <span class="portfolio-acc-title">Investment Portfolio & Holdings Ledger</span>
                </div>
                <div class="portfolio-acc-meta">
                  <span class="portfolio-acc-sum" id="pf-sum-holdings">${metrics.processedHoldings.length} Securities</span>
                  <svg class="portfolio-acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="portfolio-acc-body">
                <p style="font-size: 0.8rem; color: #94A3B8; margin-bottom: 0.5rem;">Track individual stocks, index funds, bonds, and ETFs with live gain/loss calculation.</p>
                <div class="portfolio-table-wrap">
                  <table class="portfolio-table">
                    <thead>
                      <tr>
                        <th>Security / Fund Name</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Buy Price</th>
                        <th>Current Price</th>
                        <th>Market Value</th>
                        <th>Gain / Loss</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody id="pf-holdings-tbody">
                      ${this.renderHoldingsRows(metrics.processedHoldings)}
                    </tbody>
                  </table>
                </div>
                <button class="portfolio-btn-add-row" id="pf-btn-add-holding">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add Holding Row
                </button>
              </div>
            </div>

            <!-- 6. Insurance & Protection -->
            <div class="portfolio-acc-item" data-acc="insurance">
              <div class="portfolio-acc-header">
                <div class="portfolio-acc-title-wrap">
                  <span class="portfolio-acc-number">6</span>
                  <span class="portfolio-acc-title">Insurance & Risk Protection</span>
                </div>
                <div class="portfolio-acc-meta">
                  <span class="portfolio-acc-sum">Life: ${formatCurrency(insurance.lifeCoverage || 0)}</span>
                  <svg class="portfolio-acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="portfolio-acc-body">
                <div class="portfolio-form-grid">
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Life Insurance Sum Assured</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ins-life-cov" placeholder="0" value="${insurance.lifeCoverage || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Life Insurance Annual Premium</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ins-life-prem" placeholder="0" value="${insurance.lifePremium || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Health Insurance Coverage</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ins-hlth-cov" placeholder="0" value="${insurance.healthCoverage || 0}" />
                    </div>
                  </div>
                  <div class="portfolio-field">
                    <label class="portfolio-field-label">Health Insurance Annual Premium</label>
                    <div class="portfolio-input-with-prefix">
                      <span class="portfolio-input-prefix">${curr.symbol}</span>
                      <input type="number" class="portfolio-field-input" id="pf-ins-hlth-prem" placeholder="0" value="${insurance.healthPremium || 0}" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 7. Strategic Financial Goals -->
            <div class="portfolio-acc-item" data-acc="goals">
              <div class="portfolio-acc-header">
                <div class="portfolio-acc-title-wrap">
                  <span class="portfolio-acc-number">7</span>
                  <span class="portfolio-acc-title">Financial Goals & Emergency Fund</span>
                </div>
                <div class="portfolio-acc-meta">
                  <span class="portfolio-acc-sum">${goals.length} Goals Active</span>
                  <svg class="portfolio-acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="portfolio-acc-body">
                <div class="portfolio-table-wrap">
                  <table class="portfolio-table">
                    <thead>
                      <tr>
                        <th>Goal Title</th>
                        <th>Horizon</th>
                        <th>Target Amount</th>
                        <th>Accumulated</th>
                        <th>Target Date</th>
                        <th>Progress</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody id="pf-goals-tbody">
                      ${this.renderGoalsRows(goals)}
                    </tbody>
                  </table>
                </div>
                <button class="portfolio-btn-add-row" id="pf-btn-add-goal">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add Strategic Goal
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: Visual Anchors & Live Charts -->
          <div class="portfolio-visual-panel">
            <!-- Primary Asset Allocation Donut -->
            <div class="portfolio-chart-card">
              <div class="portfolio-chart-title">
                <span>Asset Class Allocation</span>
                <span class="portfolio-chart-tag" id="pf-tag-port-val">${formatCurrency(metrics.totalAssets)}</span>
              </div>
              <div id="pf-donut-allocation"></div>
              <div class="portfolio-legend-grid" id="pf-legend-allocation">
                ${this.renderAllocationLegend(metrics.assetCategoryBreakdown)}
              </div>
            </div>

            <!-- Solvency Health Radar -->
            <div class="portfolio-chart-card">
              <div class="portfolio-chart-title">
                <span>Solvency & Emergency Health</span>
                <span class="portfolio-chart-tag">Institutional Score</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.85rem;">
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:0.25rem;">
                    <span>Emergency Fund Progress (6-Mo Target)</span>
                    <strong id="pf-prog-emg-pct">${metrics.emergencyFundProgressPct}%</strong>
                  </div>
                  <div class="portfolio-bar-bg">
                    <div class="portfolio-bar-fill" id="pf-bar-emg" style="width: ${metrics.emergencyFundProgressPct}%;"></div>
                  </div>
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:0.25rem;">
                    <span>Monthly Savings Rate</span>
                    <strong id="pf-prog-sav-pct">${metrics.savingsRatePct}%</strong>
                  </div>
                  <div class="portfolio-bar-bg">
                    <div class="portfolio-bar-fill" id="pf-bar-sav" style="width: ${Math.min(100, Math.max(0, metrics.savingsRatePct))}%;"></div>
                  </div>
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:0.25rem;">
                    <span>Debt-to-Asset Solvency Index</span>
                    <strong id="pf-prog-dta-pct">${metrics.debtToAssetRatio}%</strong>
                  </div>
                  <div class="portfolio-bar-bg">
                    <div class="portfolio-bar-fill" id="pf-bar-dta" style="width: ${Math.min(100, metrics.debtToAssetRatio)}%; background:#38BDF8;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderCharts(metrics);
    this.attachDynamicEvents();
  }

  renderHoldingsRows(holdings) {
    return holdings.map((h, i) => `
      <tr data-index="${i}">
        <td><input type="text" class="portfolio-table-input pf-h-name" value="${h.name || ''}" placeholder="Fund/Stock Name" /></td>
        <td>
          <select class="portfolio-table-input pf-h-type">
            <option value="Mutual Fund" ${h.type === 'Mutual Fund' ? 'selected' : ''}>Mutual Fund</option>
            <option value="Stock" ${h.type === 'Stock' ? 'selected' : ''}>Stock</option>
            <option value="Bond/Fixed" ${h.type === 'Bond/Fixed' ? 'selected' : ''}>Bond/Fixed</option>
            <option value="Gold/Bond" ${h.type === 'Gold/Bond' ? 'selected' : ''}>Gold/Bond</option>
            <option value="Crypto/Alt" ${h.type === 'Crypto/Alt' ? 'selected' : ''}>Crypto/Alt</option>
          </select>
        </td>
        <td><input type="number" class="portfolio-table-input pf-h-qty" style="width:70px;" value="${h.qty || 0}" placeholder="0" /></td>
        <td><input type="number" class="portfolio-table-input pf-h-buy" style="width:85px;" value="${h.buyPrice || 0}" placeholder="0" /></td>
        <td><input type="number" class="portfolio-table-input pf-h-cur" style="width:85px;" value="${h.currentPrice || 0}" placeholder="0" /></td>
        <td><strong class="pf-h-val">${formatCurrency(h.value || 0)}</strong></td>
        <td style="color: ${(h.gainLoss || 0) >= 0 ? '#10B981' : '#F87171'}; font-weight:600;" class="pf-h-gl">
          ${(h.gainLoss || 0) >= 0 ? '+' : ''}${formatCurrency(h.gainLoss || 0)} (${h.gainLossPct || 0}%)
        </td>
        <td>
          <button class="portfolio-btn-del pf-btn-del-holding" title="Delete Row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderGoalsRows(goals) {
    return goals.map((g, i) => {
      const pct = g.targetAmount > 0 ? Math.min(100, Math.round(((g.currentAmount || 0) / g.targetAmount) * 100)) : 0;
      return `
        <tr data-index="${i}">
          <td><input type="text" class="portfolio-table-input pf-g-title" value="${g.title || ''}" placeholder="Goal Title" /></td>
          <td>
            <select class="portfolio-table-input pf-g-type">
              <option value="Short-Term" ${g.type === 'Short-Term' ? 'selected' : ''}>Short-Term</option>
              <option value="Medium-Term" ${g.type === 'Medium-Term' ? 'selected' : ''}>Medium-Term</option>
              <option value="Long-Term" ${g.type === 'Long-Term' ? 'selected' : ''}>Long-Term</option>
            </select>
          </td>
          <td><input type="number" class="portfolio-table-input pf-g-target" style="width:95px;" value="${g.targetAmount || 0}" placeholder="0" /></td>
          <td><input type="number" class="portfolio-table-input pf-g-cur" style="width:95px;" value="${g.currentAmount || 0}" placeholder="0" /></td>
          <td><input type="date" class="portfolio-table-input pf-g-date" style="width:125px;" value="${g.targetDate || '2030-12-31'}" /></td>
          <td style="min-width:110px;">
            <div class="portfolio-goal-progress">
              <span style="font-size:0.75rem; font-weight:600;">${pct}%</span>
              <div class="portfolio-bar-bg">
                <div class="portfolio-bar-fill" style="width: ${pct}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <button class="portfolio-btn-del pf-btn-del-goal" title="Delete Goal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderAllocationLegend(breakdown) {
    const dots = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    return breakdown.map((item, idx) => `
      <div class="portfolio-legend-row">
        <div class="portfolio-legend-left">
          <span class="portfolio-legend-dot ${dots[idx % dots.length]}"></span>
          <span>${item.label}</span>
        </div>
        <span class="portfolio-legend-val">${formatCurrency(item.value)} (${item.percent}%)</span>
      </div>
    `).join('');
  }

  renderCharts(metrics) {
    const donutBox = this.drawer.querySelector('#pf-donut-allocation');
    if (donutBox) {
      const totAssets = metrics.totalAssets || 1;
      const segments = [
        { label: 'Equities', value: metrics.marketInvestments, percent: Math.round((metrics.marketInvestments / totAssets) * 100), colorClass: 'principal' },
        { label: 'Fixed Deposits', value: metrics.fixedDepositAssets, percent: Math.round((metrics.fixedDepositAssets / totAssets) * 100), colorClass: 'interest' },
        { label: 'Retirement', value: metrics.retirementAssets, percent: Math.round((metrics.retirementAssets / totAssets) * 100), colorClass: 'extra' },
        { label: 'Liquid Cash', value: metrics.liquidAssets, percent: Math.round((metrics.liquidAssets / totAssets) * 100), colorClass: 'principal' },
        { label: 'Real Estate', value: metrics.realEstateAssets, percent: Math.round((metrics.realEstateAssets / totAssets) * 100), colorClass: 'interest' }
      ];

      renderDonutChart(donutBox, {
        segments,
        centerLabel: 'Total Portfolio',
        centerValue: formatCurrency(metrics.totalAssets, undefined, false)
      });
    }
  }

  updateLive() {
    const metrics = calculatePortfolioMetrics(this.state);
    
    // Update Hero Stats
    const heroNw = this.drawer.querySelector('#pf-hero-nw');
    if (heroNw) heroNw.textContent = formatCurrency(metrics.netWorth);

    const heroSub = this.drawer.querySelector('#pf-hero-sub');
    if (heroSub) heroSub.textContent = `Total Assets (${formatCurrency(metrics.totalAssets)}) − Total Liabilities (${formatCurrency(metrics.totalLiabilities)})`;

    const statAssets = this.drawer.querySelector('#pf-stat-assets');
    if (statAssets) statAssets.textContent = formatCurrency(metrics.totalAssets);

    const statLiab = this.drawer.querySelector('#pf-stat-liab');
    if (statLiab) statLiab.textContent = formatCurrency(metrics.totalLiabilities);

    const statLiquid = this.drawer.querySelector('#pf-stat-liquid');
    if (statLiquid) statLiquid.textContent = formatCurrency(metrics.liquidNetWorth);

    const statSurplus = this.drawer.querySelector('#pf-stat-surplus');
    if (statSurplus) {
      statSurplus.textContent = formatCurrency(metrics.monthlyNetSurplus);
      statSurplus.className = `portfolio-stat-val ${metrics.monthlyNetSurplus >= 0 ? 'positive' : 'negative'}`;
    }

    const statSavRate = this.drawer.querySelector('#pf-stat-sav-rate');
    if (statSavRate) statSavRate.textContent = `${metrics.savingsRatePct}%`;

    const statDti = this.drawer.querySelector('#pf-stat-dti');
    if (statDti) statDti.textContent = `${metrics.debtToIncomeRatio}%`;

    const statRunway = this.drawer.querySelector('#pf-stat-runway');
    if (statRunway) statRunway.textContent = `${metrics.emergencyRunwayMonths} Mo`;

    // Update Accordion Summaries
    const sumAssets = this.drawer.querySelector('#pf-sum-assets');
    if (sumAssets) sumAssets.textContent = `Total: ${formatCurrency(metrics.totalAssets)}`;

    const sumLiab = this.drawer.querySelector('#pf-sum-liab');
    if (sumLiab) sumLiab.textContent = `Total: ${formatCurrency(metrics.totalLiabilities)}`;

    const sumCashflow = this.drawer.querySelector('#pf-sum-cashflow');
    if (sumCashflow) sumCashflow.textContent = `Surplus: ${formatCurrency(metrics.monthlyNetSurplus)}/mo`;

    const tagPortVal = this.drawer.querySelector('#pf-tag-port-val');
    if (tagPortVal) tagPortVal.textContent = formatCurrency(metrics.totalAssets);

    // Update Legend & Donut Chart
    const legendBox = this.drawer.querySelector('#pf-legend-allocation');
    if (legendBox) legendBox.innerHTML = this.renderAllocationLegend(metrics.assetCategoryBreakdown);

    this.renderCharts(metrics);

    // Update Solvency Bars
    const barEmg = this.drawer.querySelector('#pf-bar-emg');
    const progEmg = this.drawer.querySelector('#pf-prog-emg-pct');
    if (barEmg && progEmg) {
      barEmg.style.width = `${metrics.emergencyFundProgressPct}%`;
      progEmg.textContent = `${metrics.emergencyFundProgressPct}%`;
    }

    const barSav = this.drawer.querySelector('#pf-bar-sav');
    const progSav = this.drawer.querySelector('#pf-prog-sav-pct');
    if (barSav && progSav) {
      barSav.style.width = `${Math.min(100, Math.max(0, metrics.savingsRatePct))}%`;
      progSav.textContent = `${metrics.savingsRatePct}%`;
    }

    const barDta = this.drawer.querySelector('#pf-bar-dta');
    const progDta = this.drawer.querySelector('#pf-prog-dta-pct');
    if (barDta && progDta) {
      barDta.style.width = `${Math.min(100, metrics.debtToAssetRatio)}%`;
      progDta.textContent = `${metrics.debtToAssetRatio}%`;
    }

    this.triggerAutoSave();
  }

  triggerAutoSave() {
    clearTimeout(this.saveTimeout);
    const badge = this.drawer.querySelector('#pf-save-badge');
    if (badge) badge.textContent = 'Saving...';

    this.saveTimeout = setTimeout(() => {
      setStoredState('personal_portfolio', this.state);
      if (badge) badge.textContent = '✓ Saved';
    }, 400);
  }

  attachEvents() {
    this.backdrop.addEventListener('click', () => this.toggle(false));
  }

  attachDynamicEvents() {
    // Close and PDF actions
    this.drawer.querySelector('#pf-btn-close').addEventListener('click', () => this.toggle(false));
    this.drawer.querySelector('#pf-btn-download-pdf').addEventListener('click', () => generatePortfolioPDF(this.state));
    this.drawer.querySelector('#pf-btn-print-hero').addEventListener('click', () => generatePortfolioPDF(this.state));

    // Reset Defaults
    this.drawer.querySelector('#pf-btn-reset').addEventListener('click', () => {
      if (confirm('Reset your portfolio inputs to default baseline profile?')) {
        this.state = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_STATE));
        setStoredState('personal_portfolio', this.state);
        this.render();
      }
    });

    // Accordion Toggle
    const headers = this.drawer.querySelectorAll('.portfolio-acc-header');
    headers.forEach((hdr) => {
      hdr.addEventListener('click', () => {
        const item = hdr.closest('.portfolio-acc-item');
        item.classList.toggle('active');
      });
    });

    // Auto-select on focus
    this.drawer.querySelectorAll('.portfolio-field-input, .portfolio-table-input').forEach((input) => {
      input.addEventListener('focus', () => input.select());
    });

    // Bind Profile inputs
    this.bindText('pf-prof-name', (v) => { this.state.profile.fullName = v; });
    this.bindText('pf-prof-dob', (v) => { this.state.profile.dob = v; });
    this.bindText('pf-prof-email', (v) => { this.state.profile.email = v; });
    this.bindText('pf-prof-phone', (v) => { this.state.profile.phone = v; });
    this.bindText('pf-prof-occ', (v) => { this.state.profile.occupation = v; });
    this.bindText('pf-prof-emp', (v) => { this.state.profile.employer = v; });
    this.bindText('pf-prof-date', (v) => { this.state.profile.asOfDate = v; });
    this.bindNum('pf-prof-dep', (v) => { this.state.profile.dependents = v; });

    // Bind Assets inputs
    this.bindNum('pf-ast-cash', (v) => { this.state.assets.cashChecking = v; });
    this.bindNum('pf-ast-savings', (v) => { this.state.assets.savingsAccounts = v; });
    this.bindNum('pf-ast-fd', (v) => { this.state.assets.fixedDeposits = v; });
    this.bindNum('pf-ast-stocks', (v) => { this.state.assets.stocksEquities = v; });
    this.bindNum('pf-ast-mf', (v) => { this.state.assets.mutualFundsETFs = v; });
    this.bindNum('pf-ast-ret', (v) => { this.state.assets.retirementAccounts = v; });
    this.bindNum('pf-ast-re-pri', (v) => { this.state.assets.primaryResidence = v; });
    this.bindNum('pf-ast-veh', (v) => { this.state.assets.vehicles = v; });
    this.bindNum('pf-ast-val', (v) => { this.state.assets.valuablesArtJewelry = v; });
    this.bindNum('pf-ast-ins-csv', (v) => { this.state.assets.lifeInsuranceCashValue = v; });

    // Bind Liabilities inputs
    this.bindNum('pf-liab-cc', (v) => { this.state.liabilities.creditCards = v; });
    this.bindNum('pf-liab-mort', (v) => { this.state.liabilities.mortgagePrimary = v; });
    this.bindNum('pf-liab-auto', (v) => { this.state.liabilities.autoLoans = v; });
    this.bindNum('pf-liab-pers', (v) => { this.state.liabilities.personalLoans = v; });

    // Bind Cashflow inputs
    this.bindNum('pf-inc-salary', (v) => { this.state.income.primarySalary = v; });
    this.bindNum('pf-inc-sec', (v) => { this.state.income.dividendsInterest = v; });
    this.bindNum('pf-exp-fixed', (v) => { this.state.expenses.fixedLiving = v; });
    this.bindNum('pf-exp-var', (v) => { this.state.expenses.variableDiscretionary = v; });
    this.bindNum('pf-exp-debt', (v) => { this.state.expenses.debtPayments = v; });

    // Bind Insurance inputs
    this.bindNum('pf-ins-life-cov', (v) => { this.state.insurance.lifeCoverage = v; });
    this.bindNum('pf-ins-life-prem', (v) => { this.state.insurance.lifePremium = v; });
    this.bindNum('pf-ins-hlth-cov', (v) => { this.state.insurance.healthCoverage = v; });
    this.bindNum('pf-ins-hlth-prem', (v) => { this.state.insurance.healthPremium = v; });

    // Holdings dynamic table handlers
    this.drawer.querySelector('#pf-btn-add-holding').addEventListener('click', () => {
      this.state.holdings.push({
        id: 'h_' + Date.now(),
        name: 'New Security',
        type: 'Mutual Fund',
        qty: 100,
        buyPrice: 100,
        currentPrice: 120
      });
      this.refreshHoldingsTable();
      this.updateLive();
    });

    this.drawer.querySelector('#pf-holdings-tbody').addEventListener('input', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;
      const idx = Number(row.getAttribute('data-index'));
      const holding = this.state.holdings[idx];
      if (!holding) return;

      if (e.target.classList.contains('pf-h-name')) holding.name = e.target.value;
      if (e.target.classList.contains('pf-h-type')) holding.type = e.target.value;
      if (e.target.classList.contains('pf-h-qty')) holding.qty = Number(e.target.value) || 0;
      if (e.target.classList.contains('pf-h-buy')) holding.buyPrice = Number(e.target.value) || 0;
      if (e.target.classList.contains('pf-h-cur')) holding.currentPrice = Number(e.target.value) || 0;

      // Update row live
      const val = holding.qty * holding.currentPrice;
      const cost = holding.qty * holding.buyPrice;
      const gl = val - cost;
      const glPct = cost > 0 ? ((gl / cost) * 100).toFixed(2) : 0;

      const valCell = row.querySelector('.pf-h-val');
      if (valCell) valCell.textContent = formatCurrency(val);

      const glCell = row.querySelector('.pf-h-gl');
      if (glCell) {
        glCell.textContent = `${gl >= 0 ? '+' : ''}${formatCurrency(gl)} (${glPct}%)`;
        glCell.style.color = gl >= 0 ? '#10B981' : '#F87171';
      }

      this.updateLive();
    });

    this.drawer.querySelector('#pf-holdings-tbody').addEventListener('click', (e) => {
      const delBtn = e.target.closest('.pf-btn-del-holding');
      if (!delBtn) return;
      const row = delBtn.closest('tr');
      const idx = Number(row.getAttribute('data-index'));
      this.state.holdings.splice(idx, 1);
      this.refreshHoldingsTable();
      this.updateLive();
    });

    // Goals dynamic table handlers
    this.drawer.querySelector('#pf-btn-add-goal').addEventListener('click', () => {
      this.state.goals.push({
        id: 'g_' + Date.now(),
        title: 'New Financial Milestone',
        type: 'Medium-Term',
        targetAmount: 500000,
        currentAmount: 100000,
        targetDate: '2028-12-31'
      });
      this.refreshGoalsTable();
      this.updateLive();
    });

    this.drawer.querySelector('#pf-goals-tbody').addEventListener('input', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;
      const idx = Number(row.getAttribute('data-index'));
      const goal = this.state.goals[idx];
      if (!goal) return;

      if (e.target.classList.contains('pf-g-title')) goal.title = e.target.value;
      if (e.target.classList.contains('pf-g-type')) goal.type = e.target.value;
      if (e.target.classList.contains('pf-g-target')) goal.targetAmount = Number(e.target.value) || 0;
      if (e.target.classList.contains('pf-g-cur')) goal.currentAmount = Number(e.target.value) || 0;
      if (e.target.classList.contains('pf-g-date')) goal.targetDate = e.target.value;

      this.refreshGoalsTable();
      this.updateLive();
    });

    this.drawer.querySelector('#pf-goals-tbody').addEventListener('click', (e) => {
      const delBtn = e.target.closest('.pf-btn-del-goal');
      if (!delBtn) return;
      const row = delBtn.closest('tr');
      const idx = Number(row.getAttribute('data-index'));
      this.state.goals.splice(idx, 1);
      this.refreshGoalsTable();
      this.updateLive();
    });
  }

  refreshHoldingsTable() {
    const metrics = calculatePortfolioMetrics(this.state);
    const tbody = this.drawer.querySelector('#pf-holdings-tbody');
    if (tbody) tbody.innerHTML = this.renderHoldingsRows(metrics.processedHoldings);
  }

  refreshGoalsTable() {
    const tbody = this.drawer.querySelector('#pf-goals-tbody');
    if (tbody) tbody.innerHTML = this.renderGoalsRows(this.state.goals);
  }

  bindText(id, setter) {
    const input = this.drawer.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('input', (e) => {
        setter(e.target.value);
        this.updateLive();
      });
    }
  }

  bindNum(id, setter) {
    const input = this.drawer.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('input', (e) => {
        const raw = e.target.value;
        const val = raw === '' ? 0 : Math.max(0, Number(raw));
        setter(val);
        this.updateLive();
      });
    }
  }

  toggle(open) {
    this.isOpen = open !== undefined ? open : !this.isOpen;
    if (this.isOpen) {
      this.backdrop.classList.add('active');
      this.drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      this.backdrop.classList.remove('active');
      this.drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}
