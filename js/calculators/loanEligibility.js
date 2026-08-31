/**
 * Finculator Loan Eligibility Calculator
 * Reverse-solves maximum borrowing power based on FOIR / DTI ratio and monthly disposable income
 */

import { calculateLoanEligibility } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';

export function initLoanEligibility(container) {
  if (!container) return;

  const defaultState = {
    monthlyIncome: 10000,
    existingEMIs: 1200,
    interestRate: 7.0,
    tenureYears: 25,
    foirPct: 50
  };

  const state = getStoredState('loan_eligibility', defaultState);

  function calculate() {
    const months = state.tenureYears * 12;
    const res = calculateLoanEligibility(
      state.monthlyIncome,
      state.existingEMIs,
      state.interestRate,
      months,
      state.foirPct
    );
    setStoredState('loan_eligibility', state);
    return res;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Loan Eligibility Calculator</h1>
            <p class="calculator-desc">Determine your maximum borrowing power based on net monthly income, existing debt obligations, and institutional FOIR (Fixed Obligation to Income Ratio) limits.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-eligibility">Reset Defaults</button>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Income & Debt Profile</span>
              <span class="panel-subtitle">Institutional underwriting model</span>
            </div>

            <!-- Net Monthly Income -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-income-input">Net Monthly In-Hand Income</label>
                <span class="form-hint">${formatCurrency(state.monthlyIncome, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="elig-income-input" class="form-input has-prefix" min="1000" max="500000" step="500" value="${state.monthlyIncome}" />
              </div>
              <div class="slider-container">
                <input type="range" id="elig-income-slider" class="range-slider" min="2000" max="50000" step="500" value="${Math.min(state.monthlyIncome, 50000)}" />
              </div>
            </div>

            <!-- Existing Monthly EMIs -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-existing-input">Existing Monthly EMIs / Debt</label>
                <span class="form-hint">${formatCurrency(state.existingEMIs, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="elig-existing-input" class="form-input has-prefix" min="0" max="100000" step="100" value="${state.existingEMIs}" />
              </div>
              <div class="slider-container">
                <input type="range" id="elig-existing-slider" class="range-slider" min="0" max="20000" step="100" value="${Math.min(state.existingEMIs, 20000)}" />
              </div>
            </div>

            <!-- Interest Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-rate-input">Expected Loan Interest Rate</label>
                <span class="form-hint">${state.interestRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="elig-rate-input" class="form-input has-suffix" min="0.1" max="25" step="0.1" value="${state.interestRate}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="elig-rate-slider" class="range-slider" min="1" max="15" step="0.1" value="${state.interestRate}" />
              </div>
            </div>

            <!-- Loan Tenure -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-tenure-input">Loan Tenure</label>
                <span class="form-hint">${state.tenureYears} Years (${state.tenureYears * 12} Mos)</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="elig-tenure-input" class="form-input has-suffix" min="1" max="35" step="1" value="${state.tenureYears}" />
                <span class="input-suffix">Years</span>
              </div>
              <div class="slider-container">
                <input type="range" id="elig-tenure-slider" class="range-slider" min="1" max="30" step="1" value="${state.tenureYears}" />
              </div>
            </div>

            <!-- FOIR Ratio -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-foir-input">Max Allowed Debt Ratio (FOIR / DTI)</label>
                <span class="form-hint">${state.foirPct}% limit</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="elig-foir-input" class="form-input has-suffix" min="20" max="80" step="1" value="${state.foirPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="elig-foir-slider" class="range-slider" min="30" max="70" step="1" value="${state.foirPct}" />
              </div>
              <div class="slider-limits">
                <span>30% (Conservative)</span>
                <span>70% (Aggressive)</span>
              </div>
            </div>
          </div>

          <!-- Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Borrowing Capacity Matrix</span>
              <span class="panel-subtitle">${state.foirPct}% max FOIR cap</span>
            </div>

            <!-- Hero Result Card -->
            <div class="hero-metric-box">
              <span class="metric-label">Maximum Eligible Loan Amount</span>
              <span class="metric-value">${formatCurrency(res.maxLoanAmount)}</span>
              <span class="metric-subtext">Estimated maximum borrowing ceiling</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <span class="metric-label">Max Available EMI</span>
                <span class="metric-value">${formatCurrency(res.maxAvailableEMI)}</span>
                <span class="metric-subtext">Monthly repayment capacity</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Debt Capacity</span>
                <span class="metric-value">${formatCurrency(res.foirAmount)}</span>
                <span class="metric-subtext">${state.foirPct}% of income cap</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Repayment</span>
                <span class="metric-value">${formatCurrency(res.totalPayable)}</span>
                <span class="metric-subtext">Over ${state.tenureYears} years</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Interest Outlay</span>
                <span class="metric-value">${formatCurrency(res.totalInterest)}</span>
                <span class="metric-subtext">Financing cost</span>
              </div>
            </div>

            <!-- Donut Chart -->
            <div id="elig-donut-box"></div>

            <div class="breakdown-section">
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot principal"></span>
                  Loan Principal (Borrowing Capacity)
                </span>
                <span class="breakdown-val">${formatCurrency(res.maxLoanAmount)}</span>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot interest"></span>
                  Interest Over ${state.tenureYears} Years
                </span>
                <span class="breakdown-val">${formatCurrency(res.totalInterest)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Donut
    const donutBox = container.querySelector('#elig-donut-box');
    const tot = res.totalPayable || 1;
    const princPct = Math.round((res.maxLoanAmount / tot) * 100);
    const intPct = 100 - princPct;

    renderDonutChart(donutBox, {
      segments: [
        { label: 'Principal', value: res.maxLoanAmount, percent: princPct, colorClass: 'principal' },
        { label: 'Interest', value: res.totalInterest, percent: intPct, colorClass: 'interest' }
      ],
      centerLabel: 'Max Borrowing',
      centerValue: formatCurrency(res.maxLoanAmount, undefined, false)
    });

    attachEvents();
  }

  function attachEvents() {
    bindInput('elig-income-input', 'elig-income-slider', (v) => { state.monthlyIncome = v; });
    bindInput('elig-existing-input', 'elig-existing-slider', (v) => { state.existingEMIs = v; });
    bindInput('elig-rate-input', 'elig-rate-slider', (v) => { state.interestRate = v; });
    bindInput('elig-tenure-input', 'elig-tenure-slider', (v) => { state.tenureYears = v; });
    bindInput('elig-foir-input', 'elig-foir-slider', (v) => { state.foirPct = v; });

    const resetBtn = container.querySelector('#btn-reset-eligibility');
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
