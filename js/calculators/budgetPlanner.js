/**
 * Finculator 50/30/20 Budget Planner
 * Allocates net take-home income across Essential Needs, Discretionary Wants, and Savings / Debt Repayment
 */

import { calculateBudget50_30_20 } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';

export function initBudgetPlanner(container) {
  if (!container) return;

  const defaultState = {
    monthlyIncome: 6500,
    needsPct: 50,
    wantsPct: 30,
    savingsPct: 20
  };

  const state = getStoredState('budget_planner', defaultState);

  function calculate() {
    const res = calculateBudget50_30_20(
      state.monthlyIncome,
      state.needsPct,
      state.wantsPct,
      state.savingsPct
    );
    setStoredState('budget_planner', state);
    return res;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">50/30/20 Budget Rule Planner</h1>
            <p class="calculator-desc">Structure monthly cash flows into Essential Needs (50%), Discretionary Wants (30%), and Financial Savings / Investments (20%).</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-budget">Reset Defaults</button>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Inputs Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Monthly Cash Flow</span>
              <span class="panel-subtitle">Income & allocation rules</span>
            </div>

            <!-- Net Monthly Income -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-income-input">Monthly Net In-Hand Income</label>
                <span class="form-hint">${formatCurrency(state.monthlyIncome, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="bud-income-input" class="form-input has-prefix" min="500" max="500000" step="250" value="${state.monthlyIncome}" />
              </div>
              <div class="slider-container">
                <input type="range" id="bud-income-slider" class="range-slider" min="1000" max="30000" step="250" value="${Math.min(state.monthlyIncome, 30000)}" />
              </div>
            </div>

            <!-- Needs Slider -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-needs-input">Needs Ratio (Rent, Food, Utilities, Minimum Debt)</label>
                <span class="form-hint">${state.needsPct}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bud-needs-input" class="form-input has-suffix" min="10" max="80" step="1" value="${state.needsPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="bud-needs-slider" class="range-slider" min="30" max="70" step="1" value="${state.needsPct}" />
              </div>
            </div>

            <!-- Wants Slider -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-wants-input">Wants Ratio (Dining, Leisure, Travel, Subscriptions)</label>
                <span class="form-hint">${state.wantsPct}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bud-wants-input" class="form-input has-suffix" min="5" max="60" step="1" value="${state.wantsPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="bud-wants-slider" class="range-slider" min="10" max="45" step="1" value="${state.wantsPct}" />
              </div>
            </div>

            <!-- Savings Slider -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-savings-input">Savings Ratio (SIPs, Emergency, Extra Debt Payoff)</label>
                <span class="form-hint">${state.savingsPct}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bud-savings-input" class="form-input has-suffix" min="5" max="60" step="1" value="${state.savingsPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="bud-savings-slider" class="range-slider" min="10" max="50" step="1" value="${state.savingsPct}" />
              </div>
            </div>
          </div>

          <!-- Output Allocation Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Target Budget Breakdown</span>
              <span class="panel-subtitle">Monthly allocations</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card highlight">
                <span class="metric-label">Needs Target (${state.needsPct}%)</span>
                <span class="metric-value">${formatCurrency(res.needsAmount)}</span>
                <span class="metric-subtext">Essential living costs</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Wants Target (${state.wantsPct}%)</span>
                <span class="metric-value">${formatCurrency(res.wantsAmount)}</span>
                <span class="metric-subtext">Lifestyle & recreation</span>
              </div>

              <div class="summary-card">
                <span class="metric-label">Savings Target (${state.savingsPct}%)</span>
                <span class="metric-value">${formatCurrency(res.savingsAmount)}</span>
                <span class="metric-subtext">Investments & wealth</span>
              </div>
            </div>

            <!-- Allocation Donut -->
            <div id="budget-donut-box"></div>

            <div class="breakdown-section">
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot principal"></span>
                  Essential Needs (${state.needsPct}%)
                </span>
                <span class="breakdown-val">${formatCurrency(res.needsAmount)} / mo</span>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot interest"></span>
                  Discretionary Wants (${state.wantsPct}%)
                </span>
                <span class="breakdown-val">${formatCurrency(res.wantsAmount)} / mo</span>
              </div>
              <div class="breakdown-row">
                <span class="breakdown-label">
                  <span class="breakdown-dot extra"></span>
                  Wealth Accumulation (${state.savingsPct}%)
                </span>
                <span class="breakdown-val">${formatCurrency(res.savingsAmount)} / mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Donut
    const donutBox = container.querySelector('#budget-donut-box');
    renderDonutChart(donutBox, {
      segments: [
        { label: 'Needs', value: res.needsAmount, percent: state.needsPct, colorClass: 'principal' },
        { label: 'Wants', value: res.wantsAmount, percent: state.wantsPct, colorClass: 'interest' },
        { label: 'Savings', value: res.savingsAmount, percent: state.savingsPct, colorClass: 'extra' }
      ],
      centerLabel: 'Monthly Cash',
      centerValue: formatCurrency(state.monthlyIncome, undefined, false)
    });

    attachEvents();
  }

  function attachEvents() {
    bindInput('bud-income-input', 'bud-income-slider', (v) => { state.monthlyIncome = v; });
    bindInput('bud-needs-input', 'bud-needs-slider', (v) => {
      state.needsPct = v;
      rebalanceBudget('needs');
    });
    bindInput('bud-wants-input', 'bud-wants-slider', (v) => {
      state.wantsPct = v;
      rebalanceBudget('wants');
    });
    bindInput('bud-savings-input', 'bud-savings-slider', (v) => {
      state.savingsPct = v;
      rebalanceBudget('savings');
    });

    const resetBtn = container.querySelector('#btn-reset-budget');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }
  }

  function rebalanceBudget(changed) {
    const total = state.needsPct + state.wantsPct + state.savingsPct;
    if (total !== 100) {
      const diff = 100 - total;
      if (changed === 'needs') {
        state.savingsPct = Math.max(0, state.savingsPct + diff);
      } else if (changed === 'wants') {
        state.savingsPct = Math.max(0, state.savingsPct + diff);
      } else {
        state.needsPct = Math.max(0, state.needsPct + diff);
      }
    }
    render();
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
