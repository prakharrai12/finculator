/**
 * Finculator Loan Eligibility Calculator
 * Reverse-solves maximum borrowing power based on FOIR / DTI ratio and monthly disposable income
 * Calibrated for professional salary baseline (e.g. ₹200k/month = ₹2,00,000)
 */

import { calculateLoanEligibility } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';

export function initLoanEligibility(container) {
  if (!container) return;

  const defaultState = {
    monthlyIncome: 200000, // Calibrated for ₹200k/month salary
    existingEMIs: 20000,
    interestRate: 8.5,
    tenureYears: 20,
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
            <p class="calculator-desc">Determine maximum borrowing power based on net monthly income (₹200k/month baseline), existing debt obligations, and institutional FOIR limits.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-eligibility">Reset Defaults</button>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Section 1: Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Income & Debt Profile
              </span>
              <span class="panel-subtitle">UNDERWRITING INPUTS</span>
            </div>

            <!-- Net Monthly Income -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-income-input">Net Monthly In-Hand Income</label>
                <span class="form-hint" id="elig-income-hint">${formatCurrency(state.monthlyIncome, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="elig-income-input" class="form-input has-prefix" min="0" max="5000000" step="5000" placeholder="0" value="${state.monthlyIncome}" />
              </div>
              <div class="slider-container">
                <input type="range" id="elig-income-slider" class="range-slider" min="25000" max="1000000" step="5000" value="${Math.min(state.monthlyIncome, 1000000)}" />
              </div>
              <div class="slider-limits">
                <span>₹25,000 / mo</span>
                <span>₹200,000 / mo (Target)</span>
                <span>₹10 Lakh / mo</span>
              </div>
            </div>

            <!-- Existing Monthly EMIs -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-existing-input">Existing Monthly EMIs / Obligations</label>
                <span class="form-hint" id="elig-existing-hint">${formatCurrency(state.existingEMIs, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="elig-existing-input" class="form-input has-prefix" min="0" max="500000" step="1000" placeholder="0" value="${state.existingEMIs}" />
              </div>
              <div class="slider-container">
                <input type="range" id="elig-existing-slider" class="range-slider" min="0" max="100000" step="1000" value="${Math.min(state.existingEMIs, 100000)}" />
              </div>
            </div>

            <!-- Interest Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-rate-input">Expected Home Loan Rate</label>
                <span class="form-hint" id="elig-rate-hint">${state.interestRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="elig-rate-input" class="form-input has-suffix" min="0" max="20.0" step="0.1" placeholder="0" value="${state.interestRate}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="elig-rate-slider" class="range-slider" min="6.0" max="15.0" step="0.1" value="${state.interestRate}" />
              </div>
            </div>

            <!-- Loan Tenure -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-tenure-input">Loan Tenure</label>
                <span class="form-hint" id="elig-tenure-hint">${state.tenureYears} Years (${state.tenureYears * 12} Mos)</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="elig-tenure-input" class="form-input has-suffix" min="1" max="30" step="1" placeholder="1" value="${state.tenureYears}" />
                <span class="input-suffix">Years</span>
              </div>
              <div class="slider-container">
                <input type="range" id="elig-tenure-slider" class="range-slider" min="5" max="30" step="1" value="${state.tenureYears}" />
              </div>
            </div>

            <!-- FOIR Ratio -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="elig-foir-input">Max Allowed Debt Ratio (FOIR / DTI)</label>
                <span class="form-hint" id="elig-foir-hint">${state.foirPct}% limit</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="elig-foir-input" class="form-input has-suffix" min="1" max="80" step="1" placeholder="50" value="${state.foirPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="elig-foir-slider" class="range-slider" min="30" max="70" step="1" value="${state.foirPct}" />
              </div>
              <div class="slider-limits">
                <span>30% (Conservative)</span>
                <span>50% (Standard)</span>
                <span>70% (Aggressive)</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                Borrowing Capacity Matrix
              </span>
              <span class="panel-subtitle">ELIGIBILITY LIMITS</span>
            </div>

            <!-- Hero Result Card -->
            <div class="hero-metric-box">
              <span class="metric-label">Maximum Eligible Loan Amount</span>
              <span class="metric-value" id="elig-max-loan-val">${formatCurrency(res.maxLoanAmount)}</span>
              <span class="metric-subtext" id="elig-max-loan-sub">Estimated loan ceiling on ${formatCurrency(state.monthlyIncome)}/mo salary</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card highlight">
                <span class="metric-label">Available Monthly EMI</span>
                <span class="metric-value" id="elig-avail-emi-val">${formatCurrency(res.maxAvailableEMI)}</span>
                <span class="metric-subtext">Safe monthly repayment room</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Debt Capacity</span>
                <span class="metric-value" id="elig-foir-val">${formatCurrency(res.foirAmount)}</span>
                <span class="metric-subtext" id="elig-foir-sub">${state.foirPct}% FOIR limit</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Repayment</span>
                <span class="metric-value" id="elig-total-pay-val">${formatCurrency(res.totalPayable)}</span>
                <span class="metric-subtext" id="elig-total-pay-sub">Principal + Interest over ${state.tenureYears} yrs</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Interest Outlay</span>
                <span class="metric-value" id="elig-total-int-val">${formatCurrency(res.totalInterest)}</span>
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
                <span class="breakdown-val" id="elig-bd-princ">${formatCurrency(res.maxLoanAmount)}</span>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot interest"></span>
                  <span id="elig-bd-int-label">Interest Over ${state.tenureYears} Years</span>
                </span>
                <span class="breakdown-val" id="elig-bd-int">${formatCurrency(res.totalInterest)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    updateOutputs(res);
    attachEvents();
  }

  function updateOutputs(res) {
    const maxLoanVal = container.querySelector('#elig-max-loan-val');
    if (maxLoanVal) maxLoanVal.textContent = formatCurrency(res.maxLoanAmount);

    const maxLoanSub = container.querySelector('#elig-max-loan-sub');
    if (maxLoanSub) maxLoanSub.textContent = `Estimated loan ceiling on ${formatCurrency(state.monthlyIncome)}/mo salary`;

    const availEmiVal = container.querySelector('#elig-avail-emi-val');
    if (availEmiVal) availEmiVal.textContent = formatCurrency(res.maxAvailableEMI);

    const foirVal = container.querySelector('#elig-foir-val');
    if (foirVal) foirVal.textContent = formatCurrency(res.foirAmount);

    const foirSub = container.querySelector('#elig-foir-sub');
    if (foirSub) foirSub.textContent = `${state.foirPct}% FOIR limit`;

    const totalPayVal = container.querySelector('#elig-total-pay-val');
    if (totalPayVal) totalPayVal.textContent = formatCurrency(res.totalPayable);

    const totalPaySub = container.querySelector('#elig-total-pay-sub');
    if (totalPaySub) totalPaySub.textContent = `Principal + Interest over ${state.tenureYears} yrs`;

    const totalIntVal = container.querySelector('#elig-total-int-val');
    if (totalIntVal) totalIntVal.textContent = formatCurrency(res.totalInterest);

    const bdPrinc = container.querySelector('#elig-bd-princ');
    if (bdPrinc) bdPrinc.textContent = formatCurrency(res.maxLoanAmount);

    const bdIntLabel = container.querySelector('#elig-bd-int-label');
    if (bdIntLabel) bdIntLabel.textContent = `Interest Over ${state.tenureYears} Years`;

    const bdInt = container.querySelector('#elig-bd-int');
    if (bdInt) bdInt.textContent = formatCurrency(res.totalInterest);

    // Render Donut
    const donutBox = container.querySelector('#elig-donut-box');
    if (donutBox) {
      const tot = res.totalPayable || 1;
      const princPct = Math.round((res.maxLoanAmount / tot) * 100);
      const intPct = 100 - princPct;

      renderDonutChart(donutBox, {
        segments: [
          { label: 'Principal', value: res.maxLoanAmount, percent: princPct, colorClass: 'principal' },
          { label: 'Interest', value: res.totalInterest, percent: intPct, colorClass: 'interest' }
        ],
        centerLabel: 'Max Loan',
        centerValue: formatCurrency(res.maxLoanAmount, undefined, false)
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

    bindInput('elig-income-input', 'elig-income-slider', 'elig-income-hint', (v) => { state.monthlyIncome = v; }, (v) => `${formatCurrency(v, undefined, false)} / mo`);
    bindInput('elig-existing-input', 'elig-existing-slider', 'elig-existing-hint', (v) => { state.existingEMIs = v; }, (v) => `${formatCurrency(v, undefined, false)} / mo`);
    bindInput('elig-rate-input', 'elig-rate-slider', 'elig-rate-hint', (v) => { state.interestRate = v; }, (v) => `${v}%`);
    bindInput('elig-tenure-input', 'elig-tenure-slider', 'elig-tenure-hint', (v) => { state.tenureYears = v; }, (v) => `${v} Years (${v * 12} Mos)`);
    bindInput('elig-foir-input', 'elig-foir-slider', 'elig-foir-hint', (v) => { state.foirPct = v; }, (v) => `${v}% limit`);

    const resetBtn = container.querySelector('#btn-reset-eligibility');
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
