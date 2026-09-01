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
    loanAmount: 0,
    interestRate: 0,
    tenureYears: 0,
    extraMonthly: 0,
    annualLumpSum: 0
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

        <!-- Metric Highlight Banner -->
        <div class="savings-highlight-card">
          <div class="savings-main">
            <span class="savings-label">Accelerated Savings Vector</span>
            <span class="savings-value" id="prepay-saved-amt">${formatCurrency(res.savings.interestSaved)}</span>
            <span class="savings-subtext">Total interest saved with prepayments</span>
          </div>
          <div class="savings-grid">
            <div class="savings-subitem">
              <span class="sub-label">Tenure Reduction</span>
              <span class="sub-val" id="prepay-saved-tenure">${res.savings.yearsSaved} Years (${res.savings.monthsSaved} Months)</span>
            </div>
            <div class="savings-subitem">
              <span class="sub-label">Revised Payoff Period</span>
              <span class="sub-val" id="prepay-revised-period">${(res.revised.months / 12).toFixed(1)} Years</span>
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
                <span class="form-hint" id="prepay-amount-hint">${formatCurrency(state.loanAmount, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="prepay-amount-input" class="form-input has-prefix" min="0" max="50000000" step="50000" placeholder="0" value="${state.loanAmount ? state.loanAmount : ''}" />
              </div>
              <div class="slider-container">
                <input type="range" id="prepay-amount-slider" class="range-slider" min="0" max="20000000" step="50000" value="${state.loanAmount || 0}" />
              </div>
            </div>

            <!-- Interest Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="prepay-rate-input">Annual Interest Rate</label>
                <span class="form-hint" id="prepay-rate-hint">${state.interestRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="prepay-rate-input" class="form-input has-suffix" min="0" max="25" step="0.05" placeholder="0" value="${state.interestRate ? state.interestRate : ''}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="prepay-rate-slider" class="range-slider" min="0" max="25" step="0.05" value="${state.interestRate || 0}" />
              </div>
            </div>

            <!-- Tenure (Years) -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="prepay-years-input">Original Loan Tenure</label>
                <span class="form-hint" id="prepay-years-hint">${state.tenureYears} Years</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="prepay-years-input" class="form-input has-suffix" min="0" max="40" step="1" placeholder="0" value="${state.tenureYears ? state.tenureYears : ''}" />
                <span class="input-suffix">Years</span>
              </div>
              <div class="slider-container">
                <input type="range" id="prepay-years-slider" class="range-slider" min="0" max="35" step="1" value="${state.tenureYears || 0}" />
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 1rem;">
              <span class="panel-title" style="display:block; margin-bottom: 1rem;">Prepayment Contributions</span>

              <!-- Extra Monthly -->
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="prepay-monthly-input">Extra Payment (Monthly)</label>
                  <span class="form-hint" id="prepay-monthly-hint">+${formatCurrency(state.extraMonthly, undefined, false)} / mo</span>
                </div>
                <div class="input-wrapper">
                  <span class="input-prefix">${curr.symbol}</span>
                  <input type="number" id="prepay-monthly-input" class="form-input has-prefix" min="0" max="200000" step="500" placeholder="0" value="${state.extraMonthly ? state.extraMonthly : ''}" />
                </div>
                <div class="slider-container">
                  <input type="range" id="prepay-monthly-slider" class="range-slider" min="0" max="50000" step="500" value="${state.extraMonthly || 0}" />
                </div>
              </div>

              <!-- Annual Lump Sum -->
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="prepay-annual-input">Extra Lump-Sum (Annual / Year-End)</label>
                  <span class="form-hint" id="prepay-annual-hint">+${formatCurrency(state.annualLumpSum, undefined, false)} / yr</span>
                </div>
                <div class="input-wrapper">
                  <span class="input-prefix">${curr.symbol}</span>
                  <input type="number" id="prepay-annual-input" class="form-input has-prefix" min="0" max="2000000" step="5000" placeholder="0" value="${state.annualLumpSum ? state.annualLumpSum : ''}" />
                </div>
                <div class="slider-container">
                  <input type="range" id="prepay-annual-slider" class="range-slider" min="0" max="500000" step="5000" value="${state.annualLumpSum || 0}" />
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
                  <p class="metric-value" id="prepay-orig-emi" style="font-size: 1.15rem;">${formatCurrency(res.original.monthlyEMI)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Total Interest</span>
                  <p id="prepay-orig-int" style="font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums;">${formatCurrency(res.original.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Payoff Duration</span>
                  <p id="prepay-orig-dur" style="font-weight: 600; color: var(--text-secondary);">${state.tenureYears} Years (${res.original.months} Mos)</p>
                </div>
              </div>

              <!-- Revised Accelerated Plan -->
              <div class="comparison-card highlight-card">
                <span class="card-tag">Accelerated Plan</span>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">New Total Payment</span>
                  <p class="metric-value" id="prepay-rev-emi" style="font-size: 1.15rem;">${formatCurrency(res.revised.monthlyEMI)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Revised Interest</span>
                  <p id="prepay-rev-int" style="font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums;">${formatCurrency(res.revised.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Revised Duration</span>
                  <p id="prepay-rev-dur" style="font-weight: 600; color: var(--accent-obsidian);">${(res.revised.months / 12).toFixed(1)} Years (${res.revised.months} Mos)</p>
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
              <tbody id="prepay-schedule-tbody">
                ${renderScheduleRows(res.originalSchedule, res.revisedSchedule)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    updateOutputs(res);
    attachEvents();
  }

  function updateOutputs(res) {
    const savedAmt = container.querySelector('#prepay-saved-amt');
    if (savedAmt) savedAmt.textContent = formatCurrency(res.savings.interestSaved);

    const savedTenure = container.querySelector('#prepay-saved-tenure');
    if (savedTenure) savedTenure.textContent = `${res.savings.yearsSaved} Years (${res.savings.monthsSaved} Months)`;

    const revisedPeriod = container.querySelector('#prepay-revised-period');
    if (revisedPeriod) revisedPeriod.textContent = `${(res.revised.months / 12).toFixed(1)} Years`;

    const origEmi = container.querySelector('#prepay-orig-emi');
    if (origEmi) origEmi.textContent = `${formatCurrency(res.original.monthlyEMI)} / mo`;

    const origInt = container.querySelector('#prepay-orig-int');
    if (origInt) origInt.textContent = formatCurrency(res.original.totalInterest);

    const origDur = container.querySelector('#prepay-orig-dur');
    if (origDur) origDur.textContent = `${state.tenureYears} Years (${res.original.months} Mos)`;

    const revEmi = container.querySelector('#prepay-rev-emi');
    if (revEmi) revEmi.textContent = `${formatCurrency(res.revised.monthlyEMI)} / mo`;

    const revInt = container.querySelector('#prepay-rev-int');
    if (revInt) revInt.textContent = formatCurrency(res.revised.totalInterest);

    const revDur = container.querySelector('#prepay-rev-dur');
    if (revDur) revDur.textContent = `${(res.revised.months / 12).toFixed(1)} Years (${res.revised.months} Mos)`;

    const tbody = container.querySelector('#prepay-schedule-tbody');
    if (tbody) tbody.innerHTML = renderScheduleRows(res.originalSchedule, res.revisedSchedule);

    // Render Trajectory Chart
    const chartBox = container.querySelector('#prepay-comparison-chart-box');
    if (chartBox) {
      renderComparisonChart(chartBox, {
        original: res.originalSchedule,
        revised: res.revisedSchedule
      });
    }
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

  function updateLive() {
    const res = calculate();
    updateOutputs(res);
  }

  function attachEvents() {
    container.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('focus', () => input.select());
    });

    bindInput('prepay-amount-input', 'prepay-amount-slider', 'prepay-amount-hint', (v) => { state.loanAmount = v; }, (v) => formatCurrency(v, undefined, false));
    bindInput('prepay-rate-input', 'prepay-rate-slider', 'prepay-rate-hint', (v) => { state.interestRate = v; }, (v) => `${v}%`);
    bindInput('prepay-years-input', 'prepay-years-slider', 'prepay-years-hint', (v) => { state.tenureYears = v; }, (v) => `${v} Years`);
    bindInput('prepay-monthly-input', 'prepay-monthly-slider', 'prepay-monthly-hint', (v) => { state.extraMonthly = v; }, (v) => `+${formatCurrency(v, undefined, false)} / mo`);
    bindInput('prepay-annual-input', 'prepay-annual-slider', 'prepay-annual-hint', (v) => { state.annualLumpSum = v; }, (v) => `+${formatCurrency(v, undefined, false)} / yr`);

    const resetBtn = container.querySelector('#btn-reset-prepay');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.loanAmount = 0;
        state.interestRate = 0;
        state.tenureYears = 0;
        state.extraMonthly = 0;
        state.annualLumpSum = 0;
        setStoredState('prepayment', state);
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

  function bindInput(inputId, sliderId, hintId, setter, hintFormatter) {
    const input = container.querySelector(`#${inputId}`);
    const slider = container.querySelector(`#${sliderId}`);
    const hint = hintId ? container.querySelector(`#${hintId}`) : null;

    if (input) {
      input.addEventListener('input', (e) => {
        const raw = e.target.value;
        const val = raw === '' ? 0 : Math.max(0, Number(raw));
        setter(val);
        if (slider) slider.value = val;
        if (hint && hintFormatter) hint.textContent = hintFormatter(val);
        updateLive();
      });
    }
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        setter(val);
        if (input) input.value = val;
        if (hint && hintFormatter) hint.textContent = hintFormatter(val);
        updateLive();
      });
    }
  }

  render();
}
