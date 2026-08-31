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
    balance: 8000,
    aprPercent: 22.5,
    minDuePercent: 4.0,
    fixedMonthlyPayment: 300
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
            <span class="savings-amount">${formatCurrency(res.savings.interestSaved)}</span>
          </div>
          <div class="savings-meta">
            <div class="savings-subitem">
              <span class="sub-label">Debt-Free Time Saved</span>
              <span class="sub-val">${res.savings.yearsSaved} Years (${res.savings.monthsSaved} Months)</span>
            </div>
            <div class="savings-subitem">
              <span class="sub-label">Accelerated Payoff Term</span>
              <span class="sub-val">${(res.fixedPlan.months / 12).toFixed(1)} Years (${res.fixedPlan.months} Mos)</span>
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
                <span class="form-hint">${formatCurrency(state.balance, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="cc-balance-input" class="form-input has-prefix" min="100" max="500000" step="250" value="${state.balance}" />
              </div>
              <div class="slider-container">
                <input type="range" id="cc-balance-slider" class="range-slider" min="500" max="50000" step="250" value="${Math.min(state.balance, 50000)}" />
              </div>
            </div>

            <!-- APR -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="cc-apr-input">Annual Percentage Rate (APR)</label>
                <span class="form-hint">${state.aprPercent}% APR</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="cc-apr-input" class="form-input has-suffix" min="5" max="45" step="0.5" value="${state.aprPercent}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="cc-apr-slider" class="range-slider" min="10" max="40" step="0.5" value="${state.aprPercent}" />
              </div>
            </div>

            <!-- Minimum Payment % -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="cc-mindue-input">Minimum Due Percentage</label>
                <span class="form-hint">${state.minDuePercent}% (Min ${formatCurrency(25, undefined, false)})</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="cc-mindue-input" class="form-input has-suffix" min="1" max="15" step="0.5" value="${state.minDuePercent}" />
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
                <span class="form-hint">${formatCurrency(state.fixedMonthlyPayment, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="cc-fixed-input" class="form-input has-prefix" min="50" max="10000" step="25" value="${state.fixedMonthlyPayment}" />
              </div>
              <div class="slider-container">
                <input type="range" id="cc-fixed-slider" class="range-slider" min="50" max="1500" step="25" value="${Math.min(state.fixedMonthlyPayment, 1500)}" />
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
                  <p class="metric-value" style="font-size: 1.15rem;">${formatCurrency(res.minPlan.initialMonthly)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Total Interest Outlay</span>
                  <p style="font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatCurrency(res.minPlan.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Total Time to Debt-Free</span>
                  <p style="font-weight: 600; color: var(--text-muted);">${(res.minPlan.months / 12).toFixed(1)} Years (${res.minPlan.months} Mos)</p>
                </div>
              </div>

              <!-- Plan B: Fixed Payment -->
              <div class="comparison-card highlight-card">
                <span class="card-tag">Accelerated Plan</span>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Fixed Payment</span>
                  <p class="metric-value" style="font-size: 1.15rem;">${formatCurrency(res.fixedPlan.monthlyPayment)} / mo</p>
                </div>
                <div class="form-group" style="margin-bottom: 0.6rem;">
                  <span class="metric-label">Total Interest Outlay</span>
                  <p style="font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatCurrency(res.fixedPlan.totalInterest)}</p>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <span class="metric-label">Total Time to Debt-Free</span>
                  <p style="font-weight: 700; color: var(--accent-obsidian);">${(res.fixedPlan.months / 12).toFixed(1)} Years (${res.fixedPlan.months} Mos)</p>
                </div>
              </div>
            </div>

            <!-- Balance Trajectory Chart -->
            <div id="cc-chart-box" style="margin-top: 1.5rem;"></div>
          </div>
        </div>
      </div>
    `;

    // Render Trajectory Chart
    const chartBox = container.querySelector('#cc-chart-box');
    const origSched = res.minPlan.schedule.map((s) => ({ year: s.year, closingBalance: s.balance }));
    const revSched = res.fixedPlan.schedule.map((s) => ({ year: s.year, closingBalance: s.balance }));

    renderComparisonChart(chartBox, {
      original: origSched,
      revised: revSched
    });

    attachEvents();
  }

  function attachEvents() {
    bindInput('cc-balance-input', 'cc-balance-slider', (v) => { state.balance = v; });
    bindInput('cc-apr-input', 'cc-apr-slider', (v) => { state.aprPercent = v; });
    bindInput('cc-mindue-input', 'cc-mindue-slider', (v) => { state.minDuePercent = v; });
    bindInput('cc-fixed-input', 'cc-fixed-slider', (v) => { state.fixedMonthlyPayment = v; });

    const resetBtn = container.querySelector('#btn-reset-cc');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
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
