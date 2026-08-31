/**
 * Finculator Prepayment & Loan Comparison Analyzer
 * Evaluates accelerated loan payoff, interest saved, and tenure reduction
 */

import { calculateMortgagePayoffComparison } from '../math/financeMath.js';
import { formatCurrency, formatNumber, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderComparisonChart } from '../components/charts.js';
import { exportToCSV } from '../utils/export.js';

export function initPrepaymentAnalyzer(container) {
  if (!container) return;

  const defaultState = {
    loanAmount: 250000,
    interestRate: 6.5,
    tenureYears: 30,
    extraMonthly: 250,
    annualLumpSum: 1000
  };

  const state = getStoredState('prepayment', defaultState);

  function calculate() {
    const totalMonths = state.tenureYears * 12;
    const result = calculateMortgagePayoffComparison(
      state.loanAmount,
      state.interestRate,
      totalMonths,
      state.extraMonthly,
      state.annualLumpSum
    );
    setStoredState('prepayment', state);
    return result;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Prepayment & Loan Comparison Analyzer</h1>
            <p class="calculator-desc">Quantify exact interest savings and tenure reduction by injecting recurring extra payments and annual lump sums.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-prepay">Reset Defaults</button>
          </div>
        </div>

        <!-- Prominent High-Impact Savings Banner -->
        <div class="savings-banner">
          <div class="savings-info">
            <span class="savings-label">Total Interest Saved</span>
            <span class="savings-amount">${formatCurrency(res.savings.interestSaved)}</span>
          </div>
          <div class="savings-meta">
            <div class="savings-subitem">
              <span class="sub-label">Tenure Cut Off</span>
              <span class="sub-val">${res.savings.yearsSaved} Years (${res.savings.monthsSaved} Months)</span>
            </div>
            <div class="savings-subitem">
              <span class="sub-label">New Payoff Term</span>
              <span class="sub-val">${(res.revised.months / 12).toFixed(1)} Years (${res.revised.months} Mos)</span>
            </div>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Current Loan & Prepayment Strategy</span>
              <span class="panel-subtitle">Dual prepayment vectors</span>
            </div>

            <!-- Loan Balance -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="prepay-amount-input">Current Loan Balance</label>
                <span class="form-hint">${formatCurrency(state.loanAmount, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="prepay-amount-input" class="form-input has-prefix" min="5000" max="5000000" step="5000" value="${state.loanAmount}" />
              </div>
              <div class="slider-container">
                <input type="range" id="prepay-amount-slider" class="range-slider" min="10000" max="1000000" step="5000" value="${Math.min(state.loanAmount, 1000000)}" />
              </div>
            </div>

            <!-- Interest Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="prepay-rate-input">Annual Interest Rate</label>
                <span class="form-hint">${state.interestRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="prepay-rate-input" class="form-input has-suffix" min="0.1" max="25" step="0.1" value="${state.interestRate}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="prepay-rate-slider" class="range-slider" min="1" max="15" step="0.1" value="${state.interestRate}" />
              </div>
            </div>

            <!-- Tenure (Years) -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="prepay-years-input">Original Loan Tenure</label>
                <span class="form-hint">${state.tenureYears} Years</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="prepay-years-input" class="form-input has-suffix" min="1" max="40" step="1" value="${state.tenureYears}" />
                <span class="input-suffix">Years</span>
              </div>
              <div class="slider-container">
                <input type="range" id="prepay-years-slider" class="range-slider" min="5" max="35" step="1" value="${state.tenureYears}" />
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 1rem;">
              <span class="panel-title" style="display:block; margin-bottom: 1rem;">Prepayment Contributions</span>

              <!-- Extra Monthly -->
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="prepay-monthly-input">Extra Payment (Monthly)</label>
                  <span class="form-hint">+${formatCurrency(state.extraMonthly, undefined, false)} / mo</span>
                </div>
                <div class="input-wrapper">
                  <span class="input-prefix">${curr.symbol}</span>
                  <input type="number" id="prepay-monthly-input" class="form-input has-prefix" min="0" max="10000" step="25" value="${state.extraMonthly}" />
                </div>
                <div class="slider-container">
                  <input type="range" id="prepay-monthly-slider" class="range-slider" min="0" max="2000" step="25" value="${Math.min(state.extraMonthly, 2000)}" />
                </div>
              </div>

              <!-- Annual Lump Sum -->
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="prepay-annual-input">Extra Lump-Sum (Annual / Year-End)</label>
                  <span class="form-hint">+${formatCurrency(state.annualLumpSum, undefined, false)} / yr</span>
                </div>
                <div class="input-wrapper">
                  <span class="input-prefix">${curr.symbol}</span>
                  <input type="number" id="prepay-annual-input" class="form-input has-prefix" min="0" max="50000" step="250" value="${state.annualLumpSum}" />
                </div>
                <div class="slider-container">
                  <input type="range" id="prepay-annual-slider" class="range-slider" min="0" max="10000" step="250" value="${Math.min(state.annualLumpSum, 10000)}" />
                </div>
              </div>
            </div>
          </div>

          <!-- Comparison Output Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Side-by-Side Trajectory Comparison</span>
              <span class="panel-subtitle">Original vs Revised</span>
            </div>

            <div class="comparison-cards-grid">
              <!-- Original Plan -->
              <div class="comparison-card">
                <span class="card-tag">Original Plan</span>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Scheduled Payment</span>
                  <p class="metric-value" style="font-size: 1.15rem;">${formatCurrency(res.original.monthlyEMI)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Total Interest</span>
                  <p style="font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums;">${formatCurrency(res.original.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Payoff Duration</span>
                  <p style="font-weight: 600; color: var(--text-secondary);">${state.tenureYears} Years (${res.original.months} Mos)</p>
                </div>
              </div>

              <!-- Revised Accelerated Plan -->
              <div class="comparison-card highlight-card">
                <span class="card-tag">Accelerated Plan</span>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">New Total Payment</span>
                  <p class="metric-value" style="font-size: 1.15rem;">${formatCurrency(res.revised.monthlyEMI)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Revised Interest</span>
                  <p style="font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums;">${formatCurrency(res.revised.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Revised Duration</span>
                  <p style="font-weight: 600; color: var(--accent-obsidian);">${(res.revised.months / 12).toFixed(1)} Years (${res.revised.months} Mos)</p>
                </div>
              </div>
            </div>

            <!-- Trajectory Comparison Chart -->
            <div id="prepay-comparison-chart-box" style="margin-top: 1.25rem;"></div>
          </div>
        </div>

        <!-- Comparative Breakdown Table -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Comparative Payoff Schedule</span>
            <button class="btn btn-secondary btn-sm" id="btn-export-prepay-csv">Export Comparison CSV</button>
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Original Balance</th>
                  <th>Accelerated Balance</th>
                  <th>Annual Extra Paid</th>
                  <th>Cumulative Balance Delta</th>
                </tr>
              </thead>
              <tbody>
                ${renderScheduleRows(res.originalSchedule, res.revisedSchedule)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render Trajectory Chart
    const chartBox = container.querySelector('#prepay-comparison-chart-box');
    renderComparisonChart(chartBox, {
      original: res.originalSchedule,
      revised: res.revisedSchedule
    });

    attachEvents();
  }

  function renderScheduleRows(origSched, revSched) {
    const maxLen = Math.max(origSched.length, revSched.length);
    const rows = [];

    for (let i = 0; i < maxLen; i++) {
      const o = origSched[i] || { closingBalance: 0 };
      const r = revSched[i] || { closingBalance: 0, extraPaid: 0 };
      const delta = Math.max(0, o.closingBalance - r.closingBalance);
      const year = i + 1;

      rows.push(`
        <tr>
          <td><strong>Year ${year}</strong></td>
          <td>${formatCurrency(o.closingBalance)}</td>
          <td><strong>${formatCurrency(r.closingBalance)}</strong></td>
          <td>${formatCurrency(r.extraPaid || 0)}</td>
          <td style="color: var(--accent-obsidian); font-weight: 600;">-${formatCurrency(delta)}</td>
        </tr>
      `);
    }

    return rows.join('');
  }

  function attachEvents() {
    bindInput('prepay-amount-input', 'prepay-amount-slider', (v) => { state.loanAmount = v; });
    bindInput('prepay-rate-input', 'prepay-rate-slider', (v) => { state.interestRate = v; });
    bindInput('prepay-years-input', 'prepay-years-slider', (v) => { state.tenureYears = v; });
    bindInput('prepay-monthly-input', 'prepay-monthly-slider', (v) => { state.extraMonthly = v; });
    bindInput('prepay-annual-input', 'prepay-annual-slider', (v) => { state.annualLumpSum = v; });

    const resetBtn = container.querySelector('#btn-reset-prepay');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }

    const csvBtn = container.querySelector('#btn-export-prepay-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const res = calculate();
        const headers = ['Year', 'Original Balance', 'Accelerated Balance', 'Extra Paid in Year', 'Balance Difference'];
        const maxLen = Math.max(res.originalSchedule.length, res.revisedSchedule.length);
        const rows = [];
        for (let i = 0; i < maxLen; i++) {
          const o = res.originalSchedule[i] || { closingBalance: 0 };
          const r = res.revisedSchedule[i] || { closingBalance: 0, extraPaid: 0 };
          const delta = o.closingBalance - r.closingBalance;
          rows.push([`Year ${i + 1}`, o.closingBalance, r.closingBalance, r.extraPaid || 0, delta]);
        }
        exportToCSV('loan_prepayment_comparison', headers, rows);
      });
    }
  }

  function bindInput(inputId, sliderId, setter) {
    const input = container.querySelector(`#${inputId}`);
    const slider = container.querySelector(`#${sliderId}`);
    if (input) {
      input.addEventListener('input', (e) => {
        const val = Math.max(0, Number(e.target.value) || 0);
        setter(val);
        if (slider) slider.value = val;
        render();
      });
    }
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        setter(val);
        if (input) input.value = val;
        render();
      });
    }
  }

  render();
}
