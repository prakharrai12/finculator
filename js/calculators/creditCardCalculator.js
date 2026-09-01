/**
 * Finculator Credit Card Minimum-Due & Payoff Calculator
 * Exposes the compound interest debt trap of minimum payments vs accelerated payoff
 */

import { calculateCreditCardPayoff } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderComparisonChart } from '../components/charts.js';
import { exportToCSV } from '../utils/export.js';

export function initCreditCardCalculator(container) {
  if (!container) return;

  const defaultState = {
    balance: 100000,
    aprPercent: 42.0,
    minDuePercent: 5.0,
    fixedMonthlyPayment: 5000
  };

  const state = getStoredState('credit_card', defaultState);

  function calculate() {
    const res = calculateCreditCardPayoff(
      state.balance,
      state.aprPercent,
      state.minDuePercent,
      state.fixedMonthlyPayment
    );
    setStoredState('credit_card', state);
    return res;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Credit Card Minimum-Due & Payoff Calculator</h1>
            <p class="calculator-desc">Analyze the compound interest debt trap of paying only the monthly minimum due versus deploying an accelerated fixed monthly payment strategy.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-cc">Reset Defaults</button>
          </div>
        </div>

        <!-- High-Impact Savings Banner -->
        <div class="savings-banner">
          <div class="savings-info">
            <span class="savings-label">Interest Saved by Fixed Payment</span>
            <span class="savings-amount" id="cc-saved-amt">${formatCurrency(res.savings.interestSaved)}</span>
          </div>
          <div class="savings-meta">
            <div class="savings-subitem">
              <span class="sub-label">Debt-Free Time Saved</span>
              <span class="sub-val" id="cc-saved-time">${res.savings.yearsSaved} Years (${res.savings.monthsSaved} Months)</span>
            </div>
            <div class="savings-subitem">
              <span class="sub-label">Accelerated Payoff Term</span>
              <span class="sub-val" id="cc-accel-term">${(res.fixedPlan.months / 12).toFixed(1)} Years (${res.fixedPlan.months} Mos)</span>
            </div>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Card Terms & Payment Strategy</span>
              <span class="panel-subtitle">Revolving credit model</span>
            </div>

            <!-- Current Balance -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="cc-balance-input">Outstanding Balance</label>
                <span class="form-hint" id="cc-balance-hint">${formatCurrency(state.balance, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="cc-balance-input" class="form-input has-prefix" min="0" max="2000000" step="1000" placeholder="0" value="${state.balance}" />
              </div>
              <div class="slider-container">
                <input type="range" id="cc-balance-slider" class="range-slider" min="5000" max="500000" step="1000" value="${Math.min(state.balance, 500000)}" />
              </div>
            </div>

            <!-- APR -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="cc-apr-input">Annual Percentage Rate (APR)</label>
                <span class="form-hint" id="cc-apr-hint">${state.aprPercent}% APR (${(state.aprPercent / 12).toFixed(1)}%/mo)</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="cc-apr-input" class="form-input has-suffix" min="0" max="60" step="0.5" placeholder="0" value="${state.aprPercent}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="cc-apr-slider" class="range-slider" min="12" max="48" step="0.5" value="${state.aprPercent}" />
              </div>
            </div>

            <!-- Minimum Payment % -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="cc-mindue-input">Minimum Due Percentage</label>
                <span class="form-hint" id="cc-mindue-hint">${state.minDuePercent}% (Min ${formatCurrency(500, undefined, false)})</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="cc-mindue-input" class="form-input has-suffix" min="1" max="20" step="0.5" placeholder="5" value="${state.minDuePercent}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="cc-mindue-slider" class="range-slider" min="2" max="10" step="0.5" value="${state.minDuePercent}" />
              </div>
            </div>

            <!-- Fixed Monthly Payment -->
            <div class="form-group" style="border-top: 1px solid var(--border-subtle); padding-top: 1.25rem; margin-top: 1.25rem;">
              <div class="label-row">
                <label class="form-label" for="cc-fixed-input">Accelerated Fixed Monthly Payment</label>
                <span class="form-hint" id="cc-fixed-hint">${formatCurrency(state.fixedMonthlyPayment, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="cc-fixed-input" class="form-input has-prefix" min="0" max="100000" step="250" placeholder="0" value="${state.fixedMonthlyPayment}" />
              </div>
              <div class="slider-container">
                <input type="range" id="cc-fixed-slider" class="range-slider" min="1000" max="30000" step="250" value="${Math.min(state.fixedMonthlyPayment, 30000)}" />
              </div>
            </div>
          </div>

          <!-- Output Comparison Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Strategy Comparison</span>
              <span class="panel-subtitle">Minimum trap vs Fixed payoff</span>
            </div>

            <div class="comparison-cards-grid">
              <!-- Plan A: Minimum Due -->
              <div class="comparison-card">
                <span class="card-tag">Minimum Payment Trap</span>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Initial Payment</span>
                  <p class="metric-value" id="cc-min-init-pay" style="font-size: 1.15rem;">${formatCurrency(res.minPlan.initialMonthly)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Total Interest Outlay</span>
                  <p id="cc-min-tot-int" style="font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatCurrency(res.minPlan.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Total Time to Debt-Free</span>
                  <p id="cc-min-tot-time" style="font-weight: 600; color: var(--text-muted);">${(res.minPlan.months / 12).toFixed(1)} Years (${res.minPlan.months} Mos)</p>
                </div>
              </div>

              <!-- Plan B: Fixed Payment -->
              <div class="comparison-card highlight-card">
                <span class="card-tag">Accelerated Plan</span>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Fixed Payment</span>
                  <p class="metric-value" id="cc-fix-pay" style="font-size: 1.15rem;">${formatCurrency(res.fixedPlan.monthlyPayment)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Total Interest Outlay</span>
                  <p id="cc-fix-tot-int" style="font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatCurrency(res.fixedPlan.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Total Time to Debt-Free</span>
                  <p id="cc-fix-tot-time" style="font-weight: 700; color: var(--accent-obsidian);">${(res.fixedPlan.months / 12).toFixed(1)} Years (${res.fixedPlan.months} Mos)</p>
                </div>
              </div>
            </div>

            <!-- Balance Trajectory Chart -->
            <div id="cc-chart-box" style="margin-top: 1.5rem;"></div>
          </div>
        </div>
      </div>
    `;

    updateOutputs(res);
    attachEvents();
  }

  function updateOutputs(res) {
    const savedAmt = container.querySelector('#cc-saved-amt');
    if (savedAmt) savedAmt.textContent = formatCurrency(res.savings.interestSaved);

    const savedTime = container.querySelector('#cc-saved-time');
    if (savedTime) savedTime.textContent = `${res.savings.yearsSaved} Years (${res.savings.monthsSaved} Months)`;

    const accelTerm = container.querySelector('#cc-accel-term');
    if (accelTerm) accelTerm.textContent = `${(res.fixedPlan.months / 12).toFixed(1)} Years (${res.fixedPlan.months} Mos)`;

    const minInitPay = container.querySelector('#cc-min-init-pay');
    if (minInitPay) minInitPay.textContent = `${formatCurrency(res.minPlan.initialMonthly)} / mo`;

    const minTotInt = container.querySelector('#cc-min-tot-int');
    if (minTotInt) minTotInt.textContent = formatCurrency(res.minPlan.totalInterest);

    const minTotTime = container.querySelector('#cc-min-tot-time');
    if (minTotTime) minTotTime.textContent = `${(res.minPlan.months / 12).toFixed(1)} Years (${res.minPlan.months} Mos)`;

    const fixPay = container.querySelector('#cc-fix-pay');
    if (fixPay) fixPay.textContent = `${formatCurrency(res.fixedPlan.monthlyPayment)} / mo`;

    const fixTotInt = container.querySelector('#cc-fix-tot-int');
    if (fixTotInt) fixTotInt.textContent = formatCurrency(res.fixedPlan.totalInterest);

    const fixTotTime = container.querySelector('#cc-fix-tot-time');
    if (fixTotTime) fixTotTime.textContent = `${(res.fixedPlan.months / 12).toFixed(1)} Years (${res.fixedPlan.months} Mos)`;

    // Render Trajectory Chart
    const chartBox = container.querySelector('#cc-chart-box');
    if (chartBox) {
      const origSched = res.minPlan.schedule.map((s) => ({ year: s.year, closingBalance: s.balance }));
      const revSched = res.fixedPlan.schedule.map((s) => ({ year: s.year, closingBalance: s.balance }));

      renderComparisonChart(chartBox, {
        original: origSched,
        revised: revSched
      });
    }
  }

  function updateLive() {
    const res = calculate();
    updateOutputs(res);
  }

  function attachEvents() {
    container.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('focus', () => input.select());
    });

    bindInput('cc-balance-input', 'cc-balance-slider', 'cc-balance-hint', (v) => { state.balance = v; }, (v) => formatCurrency(v, undefined, false));
    bindInput('cc-apr-input', 'cc-apr-slider', 'cc-apr-hint', (v) => { state.aprPercent = v; }, (v) => `${v}% APR (${(v / 12).toFixed(1)}%/mo)`);
    bindInput('cc-mindue-input', 'cc-mindue-slider', 'cc-mindue-hint', (v) => { state.minDuePercent = v; }, (v) => `${v}% (Min ${formatCurrency(500, undefined, false)})`);
    bindInput('cc-fixed-input', 'cc-fixed-slider', 'cc-fixed-hint', (v) => { state.fixedMonthlyPayment = v; }, (v) => `${formatCurrency(v, undefined, false)} / mo`);

    const resetBtn = container.querySelector('#btn-reset-cc');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
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
