/**
 * Finculator EMI & Loan Repayment Calculator
 */

import { calculateEMI, generateAmortizationSchedule } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';
import { createAmortizationTable } from '../components/amortizationTable.js';

export function initEMICalculator(container) {
  if (!container) return;

  const defaultState = {
    loanAmount: 100000,
    interestRate: 7.5,
    tenureValue: 30,
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
            <p class="calculator-desc">Calculate fixed monthly installments, total interest liabilities, and detailed amortization step-down schedules.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-emi">Reset Defaults</button>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Loan Parameters</span>
              <span class="panel-subtitle">Institutional amortized model</span>
            </div>

            <!-- Loan Amount -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="emi-amount-input">Loan Amount</label>
                <span class="form-hint" id="emi-amount-display">${formatCurrency(state.loanAmount, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input
                  type="number"
                  id="emi-amount-input"
                  class="form-input has-prefix"
                  min="1000"
                  max="10000000"
                  step="1000"
                  value="${state.loanAmount}"
                />
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  id="emi-amount-slider"
                  class="range-slider"
                  min="1000"
                  max="2000000"
                  step="1000"
                  value="${Math.min(state.loanAmount, 2000000)}"
                />
              </div>
              <div class="slider-limits">
                <span>${curr.symbol}1,000</span>
                <span>${curr.symbol}2,000,000</span>
              </div>
            </div>

            <!-- Interest Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="emi-rate-input">Annual Interest Rate</label>
                <span class="form-hint">${formatPercent(state.interestRate, 2)}</span>
              </div>
              <div class="input-wrapper">
                <input
                  type="number"
                  id="emi-rate-input"
                  class="form-input has-suffix"
                  min="0.1"
                  max="30"
                  step="0.05"
                  value="${state.interestRate}"
                />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  id="emi-rate-slider"
                  class="range-slider"
                  min="0.5"
                  max="20"
                  step="0.1"
                  value="${state.interestRate}"
                />
              </div>
              <div class="slider-limits">
                <span>0.5%</span>
                <span>20.0%</span>
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
                  value="${state.tenureValue}"
                />
                <span class="input-suffix">${state.isYears ? 'Years' : 'Months'}</span>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  id="emi-tenure-slider"
                  class="range-slider"
                  min="1"
                  max="${state.isYears ? 35 : 420}"
                  step="1"
                  value="${state.tenureValue}"
                />
              </div>
              <div class="slider-limits">
                <span>1 ${state.isYears ? 'Yr' : 'Mo'}</span>
                <span>${state.isYears ? '35 Yrs' : '420 Mos'}</span>
              </div>
            </div>

            <!-- Processing Fee -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="emi-fee-input">Processing Fee</label>
                <span class="form-hint">${formatPercent(state.processingFeePct, 1)} (${formatCurrency(emiResult.processingFee)})</span>
              </div>
              <div class="input-wrapper">
                <input
                  type="number"
                  id="emi-fee-input"
                  class="form-input has-suffix"
                  min="0"
                  max="10"
                  step="0.1"
                  value="${state.processingFeePct}"
                />
                <span class="input-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Repayment Summary</span>
              <span class="panel-subtitle">${months} payments</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card highlight">
                <span class="metric-label">Monthly EMI</span>
                <span class="metric-value">${formatCurrency(emiResult.monthlyEMI)}</span>
                <span class="metric-subtext">Principal & interest per month</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Interest</span>
                <span class="metric-value">${formatCurrency(emiResult.totalInterest)}</span>
                <span class="metric-subtext">${emiResult.interestPercent}% of total payment</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Total Payment</span>
                <span class="metric-value">${formatCurrency(emiResult.totalPayment)}</span>
                <span class="metric-subtext">Principal + Interest</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Net Total Cost</span>
                <span class="metric-value">${formatCurrency(emiResult.netTotalCost)}</span>
                <span class="metric-subtext">Incl. ${formatCurrency(emiResult.processingFee)} fee</span>
              </div>
            </div>

            <!-- Interactive Donut Breakdown -->
            <div id="emi-donut-chart-box"></div>

            <div class="breakdown-section">
              <div class="ratio-bar">
                <div class="ratio-bar-segment primary" style="width: ${emiResult.principalPercent}%"></div>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot principal"></span>
                  Principal Amount
                </span>
                <span class="breakdown-val">${formatCurrency(state.loanAmount)} (${emiResult.principalPercent}%)</span>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot interest"></span>
                  Total Interest Charges
                </span>
                <span class="breakdown-val">${formatCurrency(emiResult.totalInterest)} (${emiResult.interestPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Full Amortization Table -->
        <div id="emi-amortization-table-container"></div>
      </div>
    `;

    // Render Donut
    const donutBox = container.querySelector('#emi-donut-chart-box');
    renderDonutChart(donutBox, {
      segments: [
        { label: 'Principal', value: state.loanAmount, percent: emiResult.principalPercent, colorClass: 'principal' },
        { label: 'Interest', value: emiResult.totalInterest, percent: emiResult.interestPercent, colorClass: 'interest' }
      ],
      centerLabel: 'Principal Ratio',
      centerValue: `${emiResult.principalPercent}%`
    });

    // Render Amortization Table
    const tableContainer = container.querySelector('#emi-amortization-table-container');
    createAmortizationTable(tableContainer, scheduleResult, {
      title: 'Full Loan Amortization Schedule',
      filename: `amortization_${state.loanAmount}_${state.interestRate}pct`
    });

    // Attach Event Listeners
    attachEvents();
  }

  function attachEvents() {
    // Amount
    const amountInput = container.querySelector('#emi-amount-input');
    const amountSlider = container.querySelector('#emi-amount-slider');
    amountInput.addEventListener('input', (e) => {
      state.loanAmount = Math.max(0, Number(e.target.value) || 0);
      if (amountSlider) amountSlider.value = Math.min(state.loanAmount, 2000000);
      updateDisplay();
    });
    amountSlider.addEventListener('input', (e) => {
      state.loanAmount = Number(e.target.value);
      amountInput.value = state.loanAmount;
      updateDisplay();
    });

    // Rate
    const rateInput = container.querySelector('#emi-rate-input');
    const rateSlider = container.querySelector('#emi-rate-slider');
    rateInput.addEventListener('input', (e) => {
      state.interestRate = Math.max(0, Number(e.target.value) || 0);
      if (rateSlider) rateSlider.value = state.interestRate;
      updateDisplay();
    });
    rateSlider.addEventListener('input', (e) => {
      state.interestRate = Number(e.target.value);
      rateInput.value = state.interestRate;
      updateDisplay();
    });

    // Tenure
    const tenureInput = container.querySelector('#emi-tenure-input');
    const tenureSlider = container.querySelector('#emi-tenure-slider');
    tenureInput.addEventListener('input', (e) => {
      state.tenureValue = Math.max(1, Number(e.target.value) || 1);
      if (tenureSlider) tenureSlider.value = state.tenureValue;
      updateDisplay();
    });
    tenureSlider.addEventListener('input', (e) => {
      state.tenureValue = Number(e.target.value);
      tenureInput.value = state.tenureValue;
      updateDisplay();
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
    feeInput.addEventListener('input', (e) => {
      state.processingFeePct = Math.max(0, Number(e.target.value) || 0);
      updateDisplay();
    });

    // Reset Defaults
    const resetBtn = container.querySelector('#btn-reset-emi');
    resetBtn.addEventListener('click', () => {
      Object.assign(state, defaultState);
      render();
    });
  }

  function updateDisplay() {
    render();
  }

  render();
}
