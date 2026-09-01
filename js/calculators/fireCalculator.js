/**
 * Finculator Retirement & FIRE (Financial Independence, Retire Early) Suite
 */

import { calculateFIRE } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderGrowthChart } from '../components/charts.js';
import { exportToCSV } from '../utils/export.js';

export function initFIRECalculator(container) {
  if (!container) return;

  const defaultState = {
    currentAge: 30,
    targetAge: 50,
    currentSavings: 1500000,
    monthlyExpenses: 80000,
    inflationRate: 6.0,
    expectedReturn: 12.0,
    swrPercent: 3.5
  };

  const state = getStoredState('fire', defaultState);

  function calculate() {
    const res = calculateFIRE(
      state.currentAge,
      state.targetAge,
      state.currentSavings,
      state.monthlyExpenses,
      state.inflationRate,
      state.expectedReturn,
      state.swrPercent
    );
    setStoredState('fire', state);
    return res;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Retirement & FIRE Corpus Engine</h1>
            <p class="calculator-desc">Calculate your exact Financial Independence number, safe withdrawal sustainability, Lean/Fat FIRE targets, and monthly savings trajectory.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-fire">Reset Defaults</button>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Personal Demographics & Assumptions</span>
              <span class="panel-subtitle">Life timeline variables</span>
            </div>

            <!-- Current & Target Age -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="fire-cur-age-input">Current Age</label>
                  <span class="form-hint">${state.currentAge} Yrs</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-cur-age-input" class="form-input" min="18" max="75" step="1" value="${state.currentAge}" />
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="fire-tgt-age-input">Retirement Age</label>
                  <span class="form-hint">${state.targetAge} Yrs</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-tgt-age-input" class="form-input" min="${state.currentAge + 1}" max="80" step="1" value="${state.targetAge}" />
                </div>
              </div>
            </div>

            <!-- Current Savings -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="fire-savings-input">Current Net Worth / Portfolio</label>
                <span class="form-hint">${formatCurrency(state.currentSavings, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="fire-savings-input" class="form-input has-prefix" min="0" max="50000000" step="25000" value="${state.currentSavings}" />
              </div>
              <div class="slider-container">
                <input type="range" id="fire-savings-slider" class="range-slider" min="0" max="10000000" step="25000" value="${Math.min(state.currentSavings, 10000000)}" />
              </div>
            </div>

            <!-- Monthly Expenses -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="fire-expenses-input">Current Monthly Living Expenses</label>
                <span class="form-hint">${formatCurrency(state.monthlyExpenses, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="fire-expenses-input" class="form-input has-prefix" min="5000" max="500000" step="2500" value="${state.monthlyExpenses}" />
              </div>
              <div class="slider-container">
                <input type="range" id="fire-expenses-slider" class="range-slider" min="10000" max="250000" step="2500" value="${Math.min(state.monthlyExpenses, 250000)}" />
              </div>
            </div>

            <!-- Inflation & Return Rates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="fire-inf-input">Inflation Rate</label>
                  <span class="form-hint">${state.inflationRate}%</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-inf-input" class="form-input has-suffix" min="1" max="15" step="0.1" value="${state.inflationRate}" />
                  <span class="input-suffix">%</span>
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="fire-ret-input">Expected Yield</label>
                  <span class="form-hint">${state.expectedReturn}%</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-ret-input" class="form-input has-suffix" min="2" max="25" step="0.1" value="${state.expectedReturn}" />
                  <span class="input-suffix">%</span>
                </div>
              </div>
            </div>

            <!-- Safe Withdrawal Rate (SWR) -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="fire-swr-input">Safe Withdrawal Rate (SWR)</label>
                <span class="form-hint">${state.swrPercent}% (${(100 / state.swrPercent).toFixed(1)}x Rule)</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="fire-swr-input" class="form-input has-suffix" min="2.5" max="6.0" step="0.1" value="${state.swrPercent}" />
                <span class="input-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Retirement Financial Blueprint</span>
              <span class="panel-subtitle">Target age ${state.targetAge} (${res.yearsToRetirement} yrs to freedom)</span>
            </div>

            <!-- Hero Result Card -->
            <div class="hero-metric-box">
              <span class="metric-label">Target FIRE Corpus</span>
              <span class="metric-value">${formatCurrency(res.fireTarget)}</span>
              <span class="metric-subtext">Required monthly savings: ${formatCurrency(res.monthlySavingsRequired)} / mo</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <span class="metric-label">Future Annual Expenses</span>
                <span class="metric-value">${formatCurrency(res.futureAnnualExpenses)}</span>
                <span class="metric-subtext">Adjusted for ${state.inflationRate}% inflation</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Savings Future Value</span>
                <span class="metric-value">${formatCurrency(res.futureSavingsAtTargetAge)}</span>
                <span class="metric-subtext">Compound growth at ${state.expectedReturn}%</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Capital Shortfall</span>
                <span class="metric-value">${formatCurrency(res.shortfall)}</span>
                <span class="metric-subtext">Remaining wealth gap</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Coast FIRE Target</span>
                <span class="metric-value">${formatCurrency(res.coastFireTarget)}</span>
                <span class="metric-subtext">Zero extra savings needed if met</span>
              </div>
            </div>

            <!-- FIRE Tiers Comparison Cards -->
            <span class="metric-label" style="display:block; margin-top: 1.25rem; margin-bottom: 0.5rem;">FIRE Milestones & Lifestyle Tiers</span>
            <div class="fire-tier-grid">
              <div class="fire-tier-card">
                <span class="fire-tier-name">Lean FIRE (75%)</span>
                <span class="fire-tier-val">${formatCurrency(res.leanFireTarget)}</span>
                <span class="fire-tier-desc">Frugal minimalist lifestyle</span>
              </div>

              <div class="fire-tier-card primary-tier">
                <span class="fire-tier-name">Standard FIRE (100%)</span>
                <span class="fire-tier-val">${formatCurrency(res.fireTarget)}</span>
                <span class="fire-tier-desc">Current standard of living</span>
              </div>

              <div class="fire-tier-card">
                <span class="fire-tier-name">Fat FIRE (130%)</span>
                <span class="fire-tier-val">${formatCurrency(res.fatFireTarget)}</span>
                <span class="fire-tier-desc">Abundant, luxury buffer</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Trajectory Chart & Schedule -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Net Worth Trajectory vs FIRE Target</span>
            <button class="btn btn-secondary btn-sm" id="btn-export-fire-csv">Export CSV</button>
          </div>
          <div id="fire-growth-chart-box"></div>

          <div class="table-wrapper" style="margin-top: 1.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Age</th>
                  <th>Year</th>
                  <th>Projected Portfolio Net Worth</th>
                  <th>Inflation-Adjusted Target Needed</th>
                </tr>
              </thead>
              <tbody>
                ${renderTrajectoryRows(res.yearlyTrajectory)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render Growth Chart
    const chartBox = container.querySelector('#fire-growth-chart-box');
    const chartData = res.yearlyTrajectory.map((row) => ({
      year: row.age,
      invested: row.targetNeeded,
      total: row.portfolioValue
    }));

    renderGrowthChart(chartBox, {
      data: chartData,
      primaryLabel: 'Projected Net Worth',
      secondaryLabel: 'FIRE Target Needed'
    });

    attachEvents();
  }

  function renderTrajectoryRows(traj) {
    return traj.map((r) => {
      return `
        <tr>
          <td><strong>Age ${r.age}</strong></td>
          <td>Yr ${r.year}</td>
          <td><strong>${formatCurrency(r.portfolioValue)}</strong></td>
          <td>${formatCurrency(r.targetNeeded)}</td>
        </tr>
      `;
    }).join('');
  }

  function attachEvents() {
    const curAgeInput = container.querySelector('#fire-cur-age-input');
    const tgtAgeInput = container.querySelector('#fire-tgt-age-input');

    if (curAgeInput) {
      curAgeInput.addEventListener('input', (e) => {
        state.currentAge = Math.max(18, Number(e.target.value) || 18);
        if (state.targetAge <= state.currentAge) {
          state.targetAge = state.currentAge + 1;
        }
        render();
      });
    }

    if (tgtAgeInput) {
      tgtAgeInput.addEventListener('input', (e) => {
        state.targetAge = Math.max(state.currentAge + 1, Number(e.target.value) || (state.currentAge + 1));
        render();
      });
    }

    bindInput('fire-savings-input', 'fire-savings-slider', (v) => { state.currentSavings = v; });
    bindInput('fire-expenses-input', 'fire-expenses-slider', (v) => { state.monthlyExpenses = v; });

    const infInput = container.querySelector('#fire-inf-input');
    if (infInput) {
      infInput.addEventListener('input', (e) => {
        state.inflationRate = Math.max(0, Number(e.target.value) || 0);
        render();
      });
    }

    const retInput = container.querySelector('#fire-ret-input');
    if (retInput) {
      retInput.addEventListener('input', (e) => {
        state.expectedReturn = Math.max(0, Number(e.target.value) || 0);
        render();
      });
    }

    const swrInput = container.querySelector('#fire-swr-input');
    if (swrInput) {
      swrInput.addEventListener('input', (e) => {
        state.swrPercent = Math.max(1, Number(e.target.value) || 4.0);
        render();
      });
    }

    const resetBtn = container.querySelector('#btn-reset-fire');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }

    const csvBtn = container.querySelector('#btn-export-fire-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const res = calculate();
        const headers = ['Age', 'Year', 'Portfolio Value', 'Target Needed'];
        const rows = res.yearlyTrajectory.map((r) => [`Age ${r.age}`, `Yr ${r.year}`, r.portfolioValue, r.targetNeeded]);
        exportToCSV('fire_retirement_projection', headers, rows);
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
