/**
 * Finculator Inflation & Purchasing Power Adjuster
 */

import { calculateInflation } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderGrowthChart } from '../components/charts.js';
import { exportToCSV } from '../utils/export.js';

export function initInflationCalculator(container) {
  if (!container) return;

  const defaultState = {
    amount: 0,
    inflationRate: 0,
    years: 0,
    direction: 'future_cost' // 'future_cost' | 'purchasing_power'
  };

  const state = getStoredState('inflation', defaultState);

  function calculate() {
    const res = calculateInflation(state.amount, state.inflationRate, state.years, state.direction);
    setStoredState('inflation', state);
    return res;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Inflation & Purchasing Power Adjuster</h1>
            <p class="calculator-desc">Forecast the erosion of fiat currency purchasing power and calculate future living costs over time.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-inflation">Reset Defaults</button>
          </div>
        </div>

        <!-- Mode Toggle Bar -->
        <div class="tab-bar" id="inflation-mode-toggle">
          <button class="tab-btn ${state.direction === 'future_cost' ? 'active' : ''}" data-mode="future_cost">Future Cost of Living (What will it cost in the future?)</button>
          <button class="tab-btn ${state.direction === 'purchasing_power' ? 'active' : ''}" data-mode="purchasing_power">Future Purchasing Power (What will today's money buy?)</button>
        </div>

        <div class="calc-grid">
          <!-- Input Controls -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Inflation Parameters</span>
              <span class="panel-subtitle">Compounded inflation rate</span>
            </div>

            <!-- Amount -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="inf-amount-input">Base Amount</label>
                <span class="form-hint" id="inf-amount-hint">${formatCurrency(state.amount, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="inf-amount-input" class="form-input has-prefix" min="0" max="10000000" step="1000" placeholder="0" value="${state.amount ? state.amount : ''}" />
              </div>
              <div class="slider-container">
                <input type="range" id="inf-amount-slider" class="range-slider" min="0" max="1000000" step="5000" value="${state.amount || 0}" />
              </div>
            </div>

            <!-- Inflation Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="inf-rate-input">Annual Inflation Rate</label>
                <span class="form-hint" id="inf-rate-hint">${state.inflationRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="inf-rate-input" class="form-input has-suffix" min="0" max="25" step="0.1" placeholder="0" value="${state.inflationRate ? state.inflationRate : ''}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="inf-rate-slider" class="range-slider" min="0" max="15" step="0.1" value="${state.inflationRate || 0}" />
              </div>
            </div>

            <!-- Years -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="inf-years-input">Time Horizon</label>
                <span class="form-hint" id="inf-years-hint">${state.years} Years</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="inf-years-input" class="form-input has-suffix" min="0" max="50" step="1" placeholder="0" value="${state.years ? state.years : ''}" />
                <span class="input-suffix">Years</span>
              </div>
              <div class="slider-container">
                <input type="range" id="inf-years-slider" class="range-slider" min="0" max="40" step="1" value="${state.years || 0}" />
              </div>
            </div>
          </div>

          <!-- Output Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Inflation Impact Summary</span>
              <span class="panel-subtitle" id="inf-impact-sub">Over ${state.years} years</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card highlight">
                <span class="metric-label" id="inf-hero-lbl">${state.direction === 'future_cost' ? 'Future Equivalent Cost' : 'Future Purchasing Value'}</span>
                <span class="metric-value" id="inf-hero-val">${formatCurrency(res.adjustedAmount)}</span>
                <span class="metric-subtext" id="inf-hero-sub">${state.direction === 'future_cost' ? `Requires +${formatCurrency(res.adjustedAmount - state.amount)} more` : `Lost ${formatCurrency(state.amount - res.adjustedAmount)} in real value`}</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Purchasing Power Lost</span>
                <span class="metric-value" id="inf-loss-pct">${res.purchasingPowerLossPct}%</span>
                <span class="metric-subtext">Real value degradation</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Inflation Multiplier</span>
                <span class="metric-value" id="inf-mult-val">${(Math.pow(1 + state.inflationRate / 100, state.years)).toFixed(2)}x</span>
                <span class="metric-subtext">Price expansion index</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Base Principal</span>
                <span class="metric-value" id="inf-base-val">${formatCurrency(state.amount)}</span>
                <span class="metric-subtext">Nominal baseline</span>
              </div>
            </div>

            <div class="breakdown-section">
              <p id="inf-narrative" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                ${state.direction === 'future_cost'
                  ? `An item or lifestyle that costs <strong>${formatCurrency(state.amount)}</strong> today will cost <strong>${formatCurrency(res.adjustedAmount)}</strong> in ${state.years} years with an annual inflation rate of ${state.inflationRate}%.`
                  : `In ${state.years} years, <strong>${formatCurrency(state.amount)}</strong> will only have the purchasing power equivalent of <strong>${formatCurrency(res.adjustedAmount)}</strong> today.`}
              </p>
            </div>
          </div>
        </div>

        <!-- Trajectory Chart & Table -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Purchasing Power Erosion & Cost Escalation Curve</span>
            <button class="btn btn-secondary btn-sm" id="btn-export-inf-csv">Export CSV</button>
          </div>
          <div id="inf-chart-box"></div>

          <div class="table-wrapper" style="margin-top: 1.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Future Cost for Same Lifestyle</th>
                  <th>Purchasing Power of Baseline Amount</th>
                  <th>Value Loss %</th>
                </tr>
              </thead>
              <tbody id="inf-table-tbody">
                ${renderTableRows(res.yearlyBreakdown)}
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
    const impactSub = container.querySelector('#inf-impact-sub');
    if (impactSub) impactSub.textContent = `Over ${state.years} years`;

    const heroLbl = container.querySelector('#inf-hero-lbl');
    if (heroLbl) heroLbl.textContent = state.direction === 'future_cost' ? 'Future Equivalent Cost' : 'Future Purchasing Value';

    const heroVal = container.querySelector('#inf-hero-val');
    if (heroVal) heroVal.textContent = formatCurrency(res.adjustedAmount);

    const heroSub = container.querySelector('#inf-hero-sub');
    if (heroSub) heroSub.textContent = state.direction === 'future_cost' ? `Requires +${formatCurrency(res.adjustedAmount - state.amount)} more` : `Lost ${formatCurrency(state.amount - res.adjustedAmount)} in real value`;

    const lossPct = container.querySelector('#inf-loss-pct');
    if (lossPct) lossPct.textContent = `${res.purchasingPowerLossPct}%`;

    const multVal = container.querySelector('#inf-mult-val');
    if (multVal) multVal.textContent = `${(Math.pow(1 + state.inflationRate / 100, state.years)).toFixed(2)}x`;

    const baseVal = container.querySelector('#inf-base-val');
    if (baseVal) baseVal.textContent = formatCurrency(state.amount);

    const narrative = container.querySelector('#inf-narrative');
    if (narrative) {
      narrative.innerHTML = state.direction === 'future_cost'
        ? `An item or lifestyle that costs <strong>${formatCurrency(state.amount)}</strong> today will cost <strong>${formatCurrency(res.adjustedAmount)}</strong> in ${state.years} years with an annual inflation rate of ${state.inflationRate}%.`
        : `In ${state.years} years, <strong>${formatCurrency(state.amount)}</strong> will only have the purchasing power equivalent of <strong>${formatCurrency(res.adjustedAmount)}</strong> today.`;
    }

    const tbody = container.querySelector('#inf-table-tbody');
    if (tbody) tbody.innerHTML = renderTableRows(res.yearlyBreakdown);

    // Render chart
    const chartBox = container.querySelector('#inf-chart-box');
    if (chartBox) {
      const chartData = res.yearlyBreakdown.map((row) => ({
        year: row.year,
        invested: row.purchasingPower,
        total: row.futureCost
      }));

      renderGrowthChart(chartBox, {
        data: chartData,
        primaryLabel: 'Future Cost Escalation',
        secondaryLabel: 'Remaining Purchasing Power'
      });
    }
  }

  function renderTableRows(breakdown) {
    return breakdown.map((row) => {
      const lossPct = Math.round((1 - row.purchasingPower / Math.max(1, state.amount)) * 100);
      return `
        <tr>
          <td><strong>Year ${row.year}</strong></td>
          <td>${formatCurrency(row.futureCost)}</td>
          <td><strong>${formatCurrency(row.purchasingPower)}</strong></td>
          <td>${lossPct}%</td>
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

    bindInput('inf-amount-input', 'inf-amount-slider', 'inf-amount-hint', (v) => { state.amount = v; }, (v) => formatCurrency(v, undefined, false));
    bindInput('inf-rate-input', 'inf-rate-slider', 'inf-rate-hint', (v) => { state.inflationRate = v; }, (v) => `${v}%`);
    bindInput('inf-years-input', 'inf-years-slider', 'inf-years-hint', (v) => { state.years = v; }, (v) => `${v} Years`);

    const modeBtns = container.querySelectorAll('#inflation-mode-toggle .tab-btn');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.direction = btn.getAttribute('data-mode');
        render();
      });
    });

    const resetBtn = container.querySelector('#btn-reset-inflation');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.amount = 0;
        state.inflationRate = 0;
        state.years = 0;
        setStoredState('inflation', state);
        render();
      });
    }

    const csvBtn = container.querySelector('#btn-export-inf-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const res = calculate();
        const headers = ['Year', 'Future Cost', 'Purchasing Power', 'Loss %'];
        const rows = res.yearlyBreakdown.map((r) => [
          `Year ${r.year}`,
          r.futureCost,
          r.purchasingPower,
          Math.round((1 - r.purchasingPower / Math.max(1, state.amount)) * 100) + '%'
        ]);
        exportToCSV('inflation_purchasing_power_projection', headers, rows);
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
