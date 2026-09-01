/**
 * Finculator EMI & Loan Repayment Calculator
 * Calibrated for realistic home and consumer loans (e.g. ₹50 Lakhs @ 8.5% for 20 yrs)
 */

import { calculateEMI, generateAmortizationSchedule } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';
import { createAmortizationTable } from '../components/amortizationTable.js';

export function initEMICalculator(container) {
  if (!container) return;

  const defaultState = {
    loanAmount: 5000000, // ₹50 Lakhs home loan default
    interestRate: 8.5,
    tenureValue: 20,
    isYears: true,
    processingFeePct: 0.5
  };

  const state = getStoredState('emi', defaultState);

  function calculate() {
    const months = state.isYears ? state.tenureValue * 12 : state.tenureValue;
    const emiResult = calculateEMI(state.loanAmount, state.interestRate, months, state.processingFeePct);
    const scheduleResult = generateAmortizationSchedule(state.loanAmount, state.interestRate, months, 0, 0);

    setStoredState('emi', state);
    return { emiResult, scheduleResult, months };
  }

  function render() {
    const { emiResult, scheduleResult, months } = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">EMI & Loan Repayment</h1>
            <p class="calculator-desc">Calculate fixed monthly installments, total interest liabilities, and detailed amortization step-down schedules (₹50 Lakhs home loan baseline).</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-emi">Reset Defaults</button>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Section 1: Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Loan Parameters
              </span>
              <span class="panel-subtitle">LOAN INPUTS</span>
            </div>

            <!-- Loan Amount -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="emi-amount-input">Principal Loan Amount</label>
                <span class="form-hint" id="emi-amount-hint">${formatCurrency(state.loanAmount, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input
                  type="number"
                  id="emi-amount-input"
                  class="form-input has-prefix"
                  min="0"
                  max="50000000"
                  step="50000"
                  placeholder="0"
                  value="${state.loanAmount}"
                />
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  id="emi-amount-slider"
                  class="range-slider"
                  min="100000"
                  max="15000000"
                  step="50000"
                  value="${Math.min(state.loanAmount, 15000000)}"
                />
              </div>
              <div class="slider-limits">
                <span>₹1 Lakh</span>
                <span>₹50 Lakh (Target)</span>
                <span>₹1.5 Crore</span>
              </div>
            </div>

            <!-- Interest Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="emi-rate-input">Annual Interest Rate</label>
                <span class="form-hint" id="emi-rate-hint">${formatPercent(state.interestRate, 2)}</span>
              </div>
              <div class="input-wrapper">
                <input
                  type="number"
                  id="emi-rate-input"
                  class="form-input has-suffix"
                  min="0"
                  max="30"
                  step="0.05"
                  placeholder="0"
                  value="${state.interestRate}"
                />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  id="emi-rate-slider"
                  class="range-slider"
                  min="5.0"
                  max="18.0"
                  step="0.1"
                  value="${state.interestRate}"
                />
              </div>
              <div class="slider-limits">
                <span>5.0%</span>
                <span>8.5% (Home Loan)</span>
                <span>18.0%</span>
              </div>
            </div>

            <!-- Loan Tenure -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="emi-tenure-input">Loan Tenure</label>
                <div class="toggle-group" id="emi-tenure-toggle">
                  <button class="toggle-option ${state.isYears ? 'active' : ''}" data-type="years">Years</button>
                  <button class="toggle-option ${!state.isYears ? 'active' : ''}" data-type="months">Months</button>
                </div>
              </div>
              <div class="input-wrapper">
                <input
                  type="number"
                  id="emi-tenure-input"
                  class="form-input has-suffix"
                  min="1"
                  max="${state.isYears ? 40 : 480}"
                  step="1"
                  placeholder="1"
                  value="${state.tenureValue}"
                />
                <span class="input-suffix" id="emi-tenure-suffix">${state.isYears ? 'Years' : 'Months'}</span>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  id="emi-tenure-slider"
                  class="range-slider"
                  min="1"
                  max="${state.isYears ? 30 : 360}"
                  step="1"
                  value="${state.tenureValue}"
                />
              </div>
              <div class="slider-limits">
                <span id="emi-limit-min">1 ${state.isYears ? 'Yr' : 'Mo'}</span>
                <span>20 Yrs (Standard)</span>
                <span id="emi-limit-max">${state.isYears ? '30 Yrs' : '360 Mos'}</span>
              </div>
            </div>

            <!-- Processing Fee -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="emi-fee-input">Bank Processing Fee</label>
                <span class="form-hint" id="emi-fee-hint">${formatPercent(state.processingFeePct, 1)} (${formatCurrency(emiResult.processingFee)})</span>
              </div>
              <div class="input-wrapper">
                <input
                  type="number"
                  id="emi-fee-input"
                  class="form-input has-suffix"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0"
                  value="${state.processingFeePct}"
                />
                <span class="input-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Repayment Outlay Summary
              </span>
              <span class="panel-subtitle" id="emi-payments-subtitle">${months} PAYMENTS</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card highlight">
                <span class="metric-label">Monthly EMI</span>
                <span class="metric-value" id="emi-monthly-val">${formatCurrency(emiResult.monthlyEMI)}</span>
                <span class="metric-subtext">Principal & interest per month</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Interest</span>
                <span class="metric-value" id="emi-interest-val">${formatCurrency(emiResult.totalInterest)}</span>
                <span class="metric-subtext" id="emi-interest-sub">${emiResult.interestPercent}% of total repayment</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Repayment</span>
                <span class="metric-value" id="emi-total-val">${formatCurrency(emiResult.totalPayment)}</span>
                <span class="metric-subtext">Principal + Interest</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Net Lifetime Cost</span>
                <span class="metric-value" id="emi-net-val">${formatCurrency(emiResult.netTotalCost)}</span>
                <span class="metric-subtext" id="emi-net-sub">Incl. ${formatCurrency(emiResult.processingFee)} fee</span>
              </div>
            </div>

            <!-- Interactive Donut Breakdown -->
            <div id="emi-donut-chart-box"></div>

            <div class="breakdown-section">
              <div class="ratio-bar">
                <div class="ratio-bar-segment primary" id="emi-ratio-bar" style="width: ${emiResult.principalPercent}%"></div>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot principal"></span>
                  Principal Amount
                </span>
                <span class="breakdown-val" id="emi-bd-principal">${formatCurrency(state.loanAmount)} (${emiResult.principalPercent}%)</span>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot interest"></span>
                  Total Interest Charges
                </span>
                <span class="breakdown-val" id="emi-bd-interest">${formatCurrency(emiResult.totalInterest)} (${emiResult.interestPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Full Amortization Table -->
        <div id="emi-amortization-table-container"></div>
      </div>
    `;

    updateOutputs(emiResult, scheduleResult, months);
    attachEvents();
  }

  function updateOutputs(emiResult, scheduleResult, months) {
    const subtitle = container.querySelector('#emi-payments-subtitle');
    if (subtitle) subtitle.textContent = `${months} PAYMENTS`;

    const monthlyVal = container.querySelector('#emi-monthly-val');
    if (monthlyVal) monthlyVal.textContent = formatCurrency(emiResult.monthlyEMI);

    const interestVal = container.querySelector('#emi-interest-val');
    if (interestVal) interestVal.textContent = formatCurrency(emiResult.totalInterest);

    const interestSub = container.querySelector('#emi-interest-sub');
    if (interestSub) interestSub.textContent = `${emiResult.interestPercent}% of total repayment`;

    const totalVal = container.querySelector('#emi-total-val');
    if (totalVal) totalVal.textContent = formatCurrency(emiResult.totalPayment);

    const netVal = container.querySelector('#emi-net-val');
    if (netVal) netVal.textContent = formatCurrency(emiResult.netTotalCost);

    const netSub = container.querySelector('#emi-net-sub');
    if (netSub) netSub.textContent = `Incl. ${formatCurrency(emiResult.processingFee)} fee`;

    const ratioBar = container.querySelector('#emi-ratio-bar');
    if (ratioBar) ratioBar.style.width = `${emiResult.principalPercent}%`;

    const bdPrincipal = container.querySelector('#emi-bd-principal');
    if (bdPrincipal) bdPrincipal.textContent = `${formatCurrency(state.loanAmount)} (${emiResult.principalPercent}%)`;

    const bdInterest = container.querySelector('#emi-bd-interest');
    if (bdInterest) bdInterest.textContent = `${formatCurrency(emiResult.totalInterest)} (${emiResult.interestPercent}%)`;

    // Render Donut
    const donutBox = container.querySelector('#emi-donut-chart-box');
    if (donutBox) {
      renderDonutChart(donutBox, {
        segments: [
          { label: 'Principal', value: state.loanAmount, percent: emiResult.principalPercent, colorClass: 'principal' },
          { label: 'Interest', value: emiResult.totalInterest, percent: emiResult.interestPercent, colorClass: 'interest' }
        ],
        centerLabel: 'Principal Ratio',
        centerValue: `${emiResult.principalPercent}%`
      });
    }

    // Render Amortization Table
    const tableContainer = container.querySelector('#emi-amortization-table-container');
    if (tableContainer) {
      createAmortizationTable(tableContainer, scheduleResult, {
        title: 'Full Loan Amortization Schedule',
        filename: `amortization_${state.loanAmount}_${state.interestRate}pct`
      });
    }
  }

  function updateLive() {
    const { emiResult, scheduleResult, months } = calculate();
    updateOutputs(emiResult, scheduleResult, months);
  }

  function attachEvents() {
    // Auto-select on focus for all inputs
    container.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('focus', () => input.select());
    });

    // Amount
    const amountInput = container.querySelector('#emi-amount-input');
    const amountSlider = container.querySelector('#emi-amount-slider');
    const amountHint = container.querySelector('#emi-amount-hint');

    amountInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.loanAmount = val === '' ? 0 : Math.max(0, Number(val));
      if (amountSlider) amountSlider.value = Math.min(state.loanAmount, 15000000);
      if (amountHint) amountHint.textContent = formatCurrency(state.loanAmount, undefined, false);
      updateLive();
    });
    amountSlider.addEventListener('input', (e) => {
      state.loanAmount = Number(e.target.value);
      amountInput.value = state.loanAmount;
      if (amountHint) amountHint.textContent = formatCurrency(state.loanAmount, undefined, false);
      updateLive();
    });

    // Rate
    const rateInput = container.querySelector('#emi-rate-input');
    const rateSlider = container.querySelector('#emi-rate-slider');
    const rateHint = container.querySelector('#emi-rate-hint');

    rateInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.interestRate = val === '' ? 0 : Math.max(0, Number(val));
      if (rateSlider) rateSlider.value = state.interestRate;
      if (rateHint) rateHint.textContent = formatPercent(state.interestRate, 2);
      updateLive();
    });
    rateSlider.addEventListener('input', (e) => {
      state.interestRate = Number(e.target.value);
      rateInput.value = state.interestRate;
      if (rateHint) rateHint.textContent = formatPercent(state.interestRate, 2);
      updateLive();
    });

    // Tenure
    const tenureInput = container.querySelector('#emi-tenure-input');
    const tenureSlider = container.querySelector('#emi-tenure-slider');

    tenureInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.tenureValue = val === '' ? 1 : Math.max(1, Number(val));
      if (tenureSlider) tenureSlider.value = state.tenureValue;
      updateLive();
    });
    tenureSlider.addEventListener('input', (e) => {
      state.tenureValue = Number(e.target.value);
      tenureInput.value = state.tenureValue;
      updateLive();
    });

    // Tenure Toggle
    const tenureToggle = container.querySelector('#emi-tenure-toggle');
    tenureToggle.querySelectorAll('.toggle-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isYears = btn.getAttribute('data-type') === 'years';
        if (state.isYears !== isYears) {
          if (isYears) {
            state.tenureValue = Math.max(1, Math.round(state.tenureValue / 12));
          } else {
            state.tenureValue = state.tenureValue * 12;
          }
          state.isYears = isYears;
          render();
        }
      });
    });

    // Fee
    const feeInput = container.querySelector('#emi-fee-input');
    const feeHint = container.querySelector('#emi-fee-hint');

    feeInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.processingFeePct = val === '' ? 0 : Math.max(0, Number(val));
      const { emiResult } = calculate();
      if (feeHint) feeHint.textContent = `${formatPercent(state.processingFeePct, 1)} (${formatCurrency(emiResult.processingFee)})`;
      updateLive();
    });

    // Reset Defaults to 0
    const resetBtn = container.querySelector('#btn-reset-emi');
    resetBtn.addEventListener('click', () => {
      state.principal = 0;
      state.rate = 0;
      state.tenureYears = 0;
      state.processingFeePct = 0;
      state.prepaymentMonthly = 0;
      state.prepaymentLumpSum = 0;
      setStoredState('emi_calculator', state);
      render();
    });
  }

  render();
}
