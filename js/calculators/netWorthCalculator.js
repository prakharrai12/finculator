/**
 * Finculator Net Worth Calculator
 * Comprehensive asset inventory vs debt liabilities analysis
 */

import { calculateNetWorth } from '../math/financeMath.js';
import { formatCurrency, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';

export function initNetWorthCalculator(container) {
  if (!container) return;

  const defaultState = {
    cash: 500000,
    investments: 2500000,
    realEstate: 8000000,
    retirement: 1500000,
    vehicles: 800000,
    otherAssets: 400000,
    // Liabilities
    mortgage: 4500000,
    autoLoans: 350000,
    studentLoans: 0,
    creditCards: 45000,
    otherDebts: 0
  };

  const state = getStoredState('net_worth', defaultState);

  function calculate() {
    const res = calculateNetWorth(
      {
        cash: state.cash,
        investments: state.investments,
        realEstate: state.realEstate,
        retirement: state.retirement,
        vehicles: state.vehicles,
        other: state.otherAssets
      },
      {
        mortgage: state.mortgage,
        autoLoans: state.autoLoans,
        studentLoans: state.studentLoans,
        creditCards: state.creditCards,
        other: state.otherDebts
      }
    );
    setStoredState('net_worth', state);
    return res;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Personal Net Worth Calculator</h1>
            <p class="calculator-desc">Quantify total financial solvency by balancing liquid & fixed asset holdings against total short-term and long-term liabilities.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-nw">Reset Defaults</button>
          </div>
        </div>

        <!-- Hero Net Worth Box -->
        <div class="hero-metric-box">
          <span class="metric-label">Total Net Worth</span>
          <span class="metric-value">${formatCurrency(res.netWorth)}</span>
          <span class="metric-subtext">Total Assets (${formatCurrency(res.totalAssets)}) − Total Liabilities (${formatCurrency(res.totalLiabilities)})</span>
        </div>

        <div class="calc-grid">
          <!-- Assets Input Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Asset Inventory</span>
              <span class="panel-subtitle">Total: ${formatCurrency(res.totalAssets)}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Cash, Savings & Emergency Funds</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-cash-input" class="form-input has-prefix" value="${state.cash}" step="10000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Brokerage, Stocks & Mutual Funds</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-inv-input" class="form-input has-prefix" value="${state.investments}" step="25000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Primary Real Estate & Property</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-re-input" class="form-input has-prefix" value="${state.realEstate}" step="50000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Retirement Accounts (EPF, PPF, NPS, Superannuation, 401k)</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-ret-input" class="form-input has-prefix" value="${state.retirement}" step="25000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Vehicles & Personal Valuables</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-veh-input" class="form-input has-prefix" value="${state.vehicles}" step="10000" />
              </div>
            </div>
          </div>

          <!-- Liabilities Input Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Liabilities & Debts</span>
              <span class="panel-subtitle">Total: ${formatCurrency(res.totalLiabilities)}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Mortgage / Home Loan Balance</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-mort-input" class="form-input has-prefix" value="${state.mortgage}" step="50000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Auto Loans</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-auto-input" class="form-input has-prefix" value="${state.autoLoans}" step="5000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Student & Personal Loans</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-stu-input" class="form-input has-prefix" value="${state.studentLoans}" step="5000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Credit Card Debt</label>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="nw-cc-input" class="form-input has-prefix" value="${state.creditCards}" step="1000" />
              </div>
            </div>

            <!-- Financial Health Ratios -->
            <div class="summary-grid" style="margin-top: 1.5rem; margin-bottom: 0;">
              <div class="summary-card">
                <span class="metric-label">Liquid Assets</span>
                <span class="metric-value">${formatCurrency(res.liquidAssets)}</span>
                <span class="metric-subtext">Cash + Investments</span>
              </div>
              <div class="summary-card">
                <span class="metric-label">Debt-to-Asset</span>
                <span class="metric-value">${res.debtToAssetRatio}%</span>
                <span class="metric-subtext">Solvency ratio</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Allocation Breakdown Panel -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Asset Allocation Distribution</span>
            <span class="panel-subtitle">Portfolio diversification</span>
          </div>

          <div id="nw-donut-box"></div>

          <div class="breakdown-section" style="margin-top: 1.5rem;">
            ${res.assetsBreakdown.map((item) => `
              <div class="breakdown-row">
                <span>${item.label}</span>
                <span><strong>${formatCurrency(item.value)}</strong> (${item.percent}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Render Asset Donut
    const donutBox = container.querySelector('#nw-donut-box');
    const totAssets = res.totalAssets || 1;
    const segments = [
      { label: 'Real Estate', value: state.realEstate, percent: Math.round((state.realEstate / totAssets) * 100), colorClass: 'principal' },
      { label: 'Investments', value: state.investments, percent: Math.round((state.investments / totAssets) * 100), colorClass: 'interest' },
      { label: 'Cash', value: state.cash, percent: Math.round((state.cash / totAssets) * 100), colorClass: 'extra' },
      { label: 'Retirement', value: state.retirement, percent: Math.round((state.retirement / totAssets) * 100), colorClass: 'principal' }
    ];

    renderDonutChart(donutBox, {
      segments,
      centerLabel: 'Total Assets',
      centerValue: formatCurrency(res.totalAssets, undefined, false)
    });

    attachEvents();
  }

  function attachEvents() {
    bindNum('nw-cash-input', (v) => { state.cash = v; });
    bindNum('nw-inv-input', (v) => { state.investments = v; });
    bindNum('nw-re-input', (v) => { state.realEstate = v; });
    bindNum('nw-ret-input', (v) => { state.retirement = v; });
    bindNum('nw-veh-input', (v) => { state.vehicles = v; });

    bindNum('nw-mort-input', (v) => { state.mortgage = v; });
    bindNum('nw-auto-input', (v) => { state.autoLoans = v; });
    bindNum('nw-stu-input', (v) => { state.studentLoans = v; });
    bindNum('nw-cc-input', (v) => { state.creditCards = v; });

    const resetBtn = container.querySelector('#btn-reset-nw');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }
  }

  function bindNum(id, setter) {
    const input = container.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('input', (e) => {
        const val = Math.max(0, Number(e.target.value) || 0);
        setter(val);
        render();
      });
    }
  }

  render();
}
