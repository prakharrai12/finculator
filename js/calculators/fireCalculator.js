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
    currentAge: 0,
    targetAge: 0,
    currentSavings: 0,
    monthlyExpenses: 0,
    inflationRate: 0,
    expectedReturn: 0,
    swrPercent: 0
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
                  <span class="form-hint" id="fire-cur-age-hint">${state.currentAge} Yrs</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-cur-age-input" class="form-input" min="0" max="75" step="1" placeholder="0" value="${state.currentAge ? state.currentAge : ''}" />
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="fire-tgt-age-input">Retirement Age</label>
                  <span class="form-hint" id="fire-tgt-age-hint">${state.targetAge} Yrs</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-tgt-age-input" class="form-input" min="0" max="80" step="1" placeholder="0" value="${state.targetAge ? state.targetAge : ''}" />
                </div>
              </div>
            </div>

            <!-- Current Savings -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="fire-savings-input">Current Net Worth / Portfolio</label>
                <span class="form-hint" id="fire-savings-hint">${formatCurrency(state.currentSavings, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="fire-savings-input" class="form-input has-prefix" min="0" max="50000000" step="25000" placeholder="0" value="${state.currentSavings ? state.currentSavings : ''}" />
              </div>
              <div class="slider-container">
                <input type="range" id="fire-savings-slider" class="range-slider" min="0" max="10000000" step="25000" value="${state.currentSavings || 0}" />
              </div>
            </div>

            <!-- Monthly Expenses -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="fire-expenses-input">Current Monthly Living Expenses</label>
                <span class="form-hint" id="fire-expenses-hint">${formatCurrency(state.monthlyExpenses, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="fire-expenses-input" class="form-input has-prefix" min="0" max="500000" step="2500" placeholder="0" value="${state.monthlyExpenses ? state.monthlyExpenses : ''}" />
              </div>
              <div class="slider-container">
                <input type="range" id="fire-expenses-slider" class="range-slider" min="0" max="250000" step="2500" value="${state.monthlyExpenses || 0}" />
              </div>
            </div>

            <!-- Inflation & Return Rates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="fire-inf-input">Inflation Rate</label>
                  <span class="form-hint" id="fire-inf-hint">${state.inflationRate}%</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-inf-input" class="form-input has-suffix" min="0" max="15" step="0.1" placeholder="0" value="${state.inflationRate ? state.inflationRate : ''}" />
                  <span class="input-suffix">%</span>
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="fire-ret-input">Expected Yield</label>
                  <span class="form-hint" id="fire-ret-hint">${state.expectedReturn}%</span>
                </div>
                <div class="input-wrapper">
                  <input type="number" id="fire-ret-input" class="form-input has-suffix" min="0" max="25" step="0.1" placeholder="0" value="${state.expectedReturn ? state.expectedReturn : ''}" />
                  <span class="input-suffix">%</span>
                </div>
              </div>
            </div>

            <!-- Safe Withdrawal Rate (SWR) -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="fire-swr-input">Safe Withdrawal Rate (SWR)</label>
                <span class="form-hint" id="fire-swr-hint">${state.swrPercent}% (${(100 / Math.max(0.1, state.swrPercent)).toFixed(1)}x Rule)</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="fire-swr-input" class="form-input has-suffix" min="0" max="10.0" step="0.1" placeholder="0" value="${state.swrPercent ? state.swrPercent : ''}" />
                <span class="input-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Retirement Financial Blueprint</span>
              <span class="panel-subtitle" id="fire-target-subtitle">Target age ${state.targetAge} (${res.yearsToRetirement} yrs to freedom)</span>
            </div>

            <!-- Hero Result Card -->
            <div class="hero-metric-box">
              <span class="metric-label">Target FIRE Corpus</span>
              <span class="metric-value" id="fire-target-val">${formatCurrency(res.fireTarget)}</span>
              <span class="metric-subtext" id="fire-savings-subtext">Required monthly savings: ${formatCurrency(res.monthlySavingsRequired)} / mo</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <span class="metric-label">Future Annual Expenses</span>
                <span class="metric-value" id="fire-fut-exp">${formatCurrency(res.futureAnnualExpenses)}</span>
                <span class="metric-subtext" id="fire-fut-exp-sub">Adjusted for ${state.inflationRate}% inflation</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Savings Future Value</span>
                <span class="metric-value" id="fire-fut-sav">${formatCurrency(res.futureSavingsAtTargetAge)}</span>
                <span class="metric-subtext" id="fire-fut-sav-sub">Compound growth at ${state.expectedReturn}%</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Capital Shortfall</span>
                <span class="metric-value" id="fire-shortfall">${formatCurrency(res.shortfall)}</span>
                <span class="metric-subtext">Remaining wealth gap</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Coast FIRE Target</span>
                <span class="metric-value" id="fire-coast">${formatCurrency(res.coastFireTarget)}</span>
                <span class="metric-subtext">Zero extra savings needed if met</span>
              </div>
            </div>

            <!-- FIRE Tiers Comparison Cards -->
            <span class="metric-label" style="display:block; margin-top: 1.25rem; margin-bottom: 0.5rem;">FIRE Milestones & Lifestyle Tiers</span>
            <div class="fire-tier-grid">
              <div class="fire-tier-card">
                <span class="fire-tier-name">Lean FIRE (75%)</span>
                <span class="fire-tier-val" id="fire-lean-val">${formatCurrency(res.leanFireTarget)}</span>
                <span class="fire-tier-desc">Frugal minimalist lifestyle</span>
              </div>

              <div class="fire-tier-card primary-tier">
                <span class="fire-tier-name">Standard FIRE (100%)</span>
                <span class="fire-tier-val" id="fire-std-val">${formatCurrency(res.fireTarget)}</span>
                <span class="fire-tier-desc">Current standard of living</span>
              </div>

              <div class="fire-tier-card">
                <span class="fire-tier-name">Fat FIRE (130%)</span>
                <span class="fire-tier-val" id="fire-fat-val">${formatCurrency(res.fatFireTarget)}</span>
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
              <tbody id="fire-traj-tbody">
                ${renderTrajectoryRows(res.yearlyTrajectory)}
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
    const targetSub = container.querySelector('#fire-target-subtitle');
    if (targetSub) targetSub.textContent = `Target age ${state.targetAge} (${res.yearsToRetirement} yrs to freedom)`;

    const targetVal = container.querySelector('#fire-target-val');
    if (targetVal) targetVal.textContent = formatCurrency(res.fireTarget);

    const savSub = container.querySelector('#fire-savings-subtext');
    if (savSub) savSub.textContent = `Required monthly savings: ${formatCurrency(res.monthlySavingsRequired)} / mo`;

    const futExp = container.querySelector('#fire-fut-exp');
    if (futExp) futExp.textContent = formatCurrency(res.futureAnnualExpenses);

    const futExpSub = container.querySelector('#fire-fut-exp-sub');
    if (futExpSub) futExpSub.textContent = `Adjusted for ${state.inflationRate}% inflation`;

    const futSav = container.querySelector('#fire-fut-sav');
    if (futSav) futSav.textContent = formatCurrency(res.futureSavingsAtTargetAge);

    const futSavSub = container.querySelector('#fire-fut-sav-sub');
    if (futSavSub) futSavSub.textContent = `Compound growth at ${state.expectedReturn}%`;

    const shortfall = container.querySelector('#fire-shortfall');
    if (shortfall) shortfall.textContent = formatCurrency(res.shortfall);

    const coast = container.querySelector('#fire-coast');
    if (coast) coast.textContent = formatCurrency(res.coastFireTarget);

    const leanVal = container.querySelector('#fire-lean-val');
    if (leanVal) leanVal.textContent = formatCurrency(res.leanFireTarget);

    const stdVal = container.querySelector('#fire-std-val');
    if (stdVal) stdVal.textContent = formatCurrency(res.fireTarget);

    const fatVal = container.querySelector('#fire-fat-val');
    if (fatVal) fatVal.textContent = formatCurrency(res.fatFireTarget);

    const tbody = container.querySelector('#fire-traj-tbody');
    if (tbody) tbody.innerHTML = renderTrajectoryRows(res.yearlyTrajectory);

    // Render Growth Chart
    const chartBox = container.querySelector('#fire-growth-chart-box');
    if (chartBox) {
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
    }
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

  function updateLive() {
    const res = calculate();
    updateOutputs(res);
  }

  function attachEvents() {
    container.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('focus', () => input.select());
    });

    const curAgeInput = container.querySelector('#fire-cur-age-input');
    const tgtAgeInput = container.querySelector('#fire-tgt-age-input');
    const curAgeHint = container.querySelector('#fire-cur-age-hint');
    const tgtAgeHint = container.querySelector('#fire-tgt-age-hint');

    if (curAgeInput) {
      curAgeInput.addEventListener('input', (e) => {
        const raw = e.target.value;
        state.currentAge = raw === '' ? 0 : Math.max(0, Number(raw));
        if (curAgeHint) curAgeHint.textContent = `${state.currentAge} Yrs`;
        updateLive();
      });
    }

    if (tgtAgeInput) {
      tgtAgeInput.addEventListener('input', (e) => {
        const raw = e.target.value;
        state.targetAge = raw === '' ? 0 : Math.max(0, Number(raw));
        if (tgtAgeHint) tgtAgeHint.textContent = `${state.targetAge} Yrs`;
        updateLive();
      });
    }

    bindInput('fire-savings-input', 'fire-savings-slider', 'fire-savings-hint', (v) => { state.currentSavings = v; }, (v) => formatCurrency(v, undefined, false));
    bindInput('fire-expenses-input', 'fire-expenses-slider', 'fire-expenses-hint', (v) => { state.monthlyExpenses = v; }, (v) => `${formatCurrency(v, undefined, false)} / mo`);

    const infInput = container.querySelector('#fire-inf-input');
    const infHint = container.querySelector('#fire-inf-hint');
    if (infInput) {
      infInput.addEventListener('input', (e) => {
        const raw = e.target.value;
        state.inflationRate = raw === '' ? 0 : Math.max(0, Number(raw));
        if (infHint) infHint.textContent = `${state.inflationRate}%`;
        updateLive();
      });
    }

    const retInput = container.querySelector('#fire-ret-input');
    const retHint = container.querySelector('#fire-ret-hint');
    if (retInput) {
      retInput.addEventListener('input', (e) => {
        const raw = e.target.value;
        state.expectedReturn = raw === '' ? 0 : Math.max(0, Number(raw));
        if (retHint) retHint.textContent = `${state.expectedReturn}%`;
        updateLive();
      });
    }

    const swrInput = container.querySelector('#fire-swr-input');
    const swrHint = container.querySelector('#fire-swr-hint');
    if (swrInput) {
      swrInput.addEventListener('input', (e) => {
        const raw = e.target.value;
        state.swrPercent = raw === '' ? 0 : Math.max(0.1, Number(raw));
        if (swrHint) swrHint.textContent = `${state.swrPercent}% (${(100 / Math.max(0.1, state.swrPercent)).toFixed(1)}x Rule)`;
        updateLive();
      });
    }

    const resetBtn = container.querySelector('#btn-reset-fire');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.currentAge = 0;
        state.targetAge = 0;
        state.monthlyExpenses = 0;
        state.currentSavings = 0;
        state.inflationRate = 0;
        state.expectedReturn = 0;
        state.swrPercent = 0;
        setStoredState('fire', state);
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
