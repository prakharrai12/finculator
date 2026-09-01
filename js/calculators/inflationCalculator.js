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
    amount: 100000,
    inflationRate: 6.0,
    years: 20,
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
                <span class="form-hint">${formatCurrency(state.amount, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="inf-amount-input" class="form-input has-prefix" min="100" max="10000000" step="1000" value="${state.amount}" />
              </div>
              <div class="slider-container">
                <input type="range" id="inf-amount-slider" class="range-slider" min="5000" max="1000000" step="5000" value="${Math.min(state.amount, 1000000)}" />
              </div>
            </div>

            <!-- Inflation Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="inf-rate-input">Annual Inflation Rate</label>
                <span class="form-hint">${state.inflationRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="inf-rate-input" class="form-input has-suffix" min="0.1" max="25" step="0.1" value="${state.inflationRate}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="inf-rate-slider" class="range-slider" min="0.5" max="15" step="0.1" value="${state.inflationRate}" />
              </div>
            </div>

            <!-- Years -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="inf-years-input">Time Horizon</label>
                <span class="form-hint">${state.years} Years</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="inf-years-input" class="form-input has-suffix" min="1" max="50" step="1" value="${state.years}" />
                <span class="input-suffix">Years</span>
              </div>
              <div class="slider-container">
                <input type="range" id="inf-years-slider" class="range-slider" min="1" max="40" step="1" value="${state.years}" />
              </div>
            </div>
          </div>

          <!-- Output Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Inflation Impact Summary</span>
              <span class="panel-subtitle">Over ${state.years} years</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card highlight">
                <span class="metric-label">${state.direction === 'future_cost' ? 'Future Equivalent Cost' : 'Future Purchasing Value'}</span>
                <span class="metric-value">${formatCurrency(res.adjustedAmount)}</span>
                <span class="metric-subtext">${state.direction === 'future_cost' ? `Requires +${formatCurrency(res.adjustedAmount - state.amount)} more` : `Lost ${formatCurrency(state.amount - res.adjustedAmount)} in real value`}</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Purchasing Power Lost</span>
                <span class="metric-value">${res.purchasingPowerLossPct}%</span>
                <span class="metric-subtext">Real value degradation</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Inflation Multiplier</span>
                <span class="metric-value">${(Math.pow(1 + state.inflationRate / 100, state.years)).toFixed(2)}x</span>
                <span class="metric-subtext">Price expansion index</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Base Principal</span>
                <span class="metric-value">${formatCurrency(state.amount)}</span>
                <span class="metric-subtext">Nominal baseline</span>
              </div>
            </div>

            <div class="breakdown-section">
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
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
              <tbody>
                ${renderTableRows(res.yearlyBreakdown)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render chart
    const chartBox = container.querySelector('#inf-chart-box');
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

    attachEvents();
  }

  function renderTableRows(breakdown) {
    return breakdown.map((row) => {
      const lossPct = Math.round((1 - row.purchasingPower / state.amount) * 100);
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

  function attachEvents() {
    bindInput('inf-amount-input', 'inf-amount-slider', (v) => { state.amount = v; });
    bindInput('inf-rate-input', 'inf-rate-slider', (v) => { state.inflationRate = v; });
    bindInput('inf-years-input', 'inf-years-slider', (v) => { state.years = v; });

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
        Object.assign(state, defaultState);
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
          Math.round((1 - r.purchasingPower / state.amount) * 100) + '%'
        ]);
        exportToCSV('inflation_purchasing_power_projection', headers, rows);
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
