/**
 * Finculator 50/30/20 Budget Planner
 * Allocates net take-home income across Essential Needs, Discretionary Wants, and Savings / Debt Repayment
 * Calibrated for professional salary baseline (e.g. ₹200k/month = ₹2,00,000)
 */

import { calculateBudget50_30_20 } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';

export function initBudgetPlanner(container) {
  if (!container) return;

  const defaultState = {
    monthlyIncome: 200000, // Calibrated for ₹200k/month salary
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
            <p class="calculator-desc">Structure monthly cash flows into Essential Needs (50%), Discretionary Wants (30%), and Financial Savings / Investments (20%) based on your ₹200k/month salary.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-budget">Reset Defaults</button>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Section 1: Inputs Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                Monthly Cash Flow Profile
              </span>
              <span class="panel-subtitle">INCOME ALLOCATION</span>
            </div>

            <!-- Net Monthly Income -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-income-input">Monthly Net In-Hand Income</label>
                <span class="form-hint" id="bud-income-hint">${formatCurrency(state.monthlyIncome, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="bud-income-input" class="form-input has-prefix" min="0" max="5000000" step="5000" placeholder="0" value="${state.monthlyIncome}" />
              </div>
              <div class="slider-container">
                <input type="range" id="bud-income-slider" class="range-slider" min="20000" max="1000000" step="5000" value="${Math.min(state.monthlyIncome, 1000000)}" />
              </div>
              <div class="slider-limits">
                <span>₹20k / mo</span>
                <span>₹200k / mo (Target)</span>
                <span>₹10 Lakh / mo</span>
              </div>
            </div>

            <!-- Needs Slider -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-needs-input">Needs Ratio (Rent, Groceries, Utilities, EMIs)</label>
                <span class="form-hint" id="bud-needs-hint">${state.needsPct}% (${formatCurrency(res.needsAmount)})</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bud-needs-input" class="form-input has-suffix" min="0" max="100" step="1" placeholder="50" value="${state.needsPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="bud-needs-slider" class="range-slider" min="10" max="80" step="1" value="${state.needsPct}" />
              </div>
            </div>

            <!-- Wants Slider -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-wants-input">Wants Ratio (Dining, Leisure, Shopping, Subscriptions)</label>
                <span class="form-hint" id="bud-wants-hint">${state.wantsPct}% (${formatCurrency(res.wantsAmount)})</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bud-wants-input" class="form-input has-suffix" min="0" max="100" step="1" placeholder="30" value="${state.wantsPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="bud-wants-slider" class="range-slider" min="5" max="60" step="1" value="${state.wantsPct}" />
              </div>
            </div>

            <!-- Savings Slider -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bud-savings-input">Savings Ratio (Mutual Funds, SIPs, Emergency Reserve)</label>
                <span class="form-hint" id="bud-savings-hint">${state.savingsPct}% (${formatCurrency(res.savingsAmount)})</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bud-savings-input" class="form-input has-suffix" min="0" max="100" step="1" placeholder="20" value="${state.savingsPct}" />
                <span class="input-suffix">%</span>
              </div>
              <div class="slider-container">
                <input type="range" id="bud-savings-slider" class="range-slider" min="5" max="60" step="1" value="${state.savingsPct}" />
              </div>
            </div>
          </div>

          <!-- Section 2: Output Allocation Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                Target Budget Breakdown
              </span>
              <span class="panel-subtitle">MONTHLY TARGETS</span>
            </div>

            <div class="summary-grid">
              <div class="summary-card highlight">
                <span class="metric-label" id="bud-card-needs-lbl">Essential Needs (${state.needsPct}%)</span>
                <span class="metric-value" id="bud-card-needs-val">${formatCurrency(res.needsAmount)}</span>
                <span class="metric-subtext">Core living expenses</span>
              </div>

              <div class="summary-card">
                <span class="metric-label" id="bud-card-wants-lbl">Discretionary Wants (${state.wantsPct}%)</span>
                <span class="metric-value" id="bud-card-wants-val">${formatCurrency(res.wantsAmount)}</span>
                <span class="metric-subtext">Lifestyle & recreational buffer</span>
              </div>

              <div class="summary-card">
                <span class="metric-label" id="bud-card-sav-lbl">Wealth Building (${state.savingsPct}%)</span>
                <span class="metric-value" id="bud-card-sav-val">${formatCurrency(res.savingsAmount)}</span>
                <span class="metric-subtext">Monthly SIPs & investments</span>
              </div>
            </div>

            <!-- Allocation Donut -->
            <div id="budget-donut-box"></div>

            <div class="breakdown-section" id="bud-breakdown-box">
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

    updateOutputs(res);
    attachEvents();
  }

  function updateOutputs(res) {
    const cardNeedsLbl = container.querySelector('#bud-card-needs-lbl');
    if (cardNeedsLbl) cardNeedsLbl.textContent = `Essential Needs (${state.needsPct}%)`;

    const cardNeedsVal = container.querySelector('#bud-card-needs-val');
    if (cardNeedsVal) cardNeedsVal.textContent = formatCurrency(res.needsAmount);

    const cardWantsLbl = container.querySelector('#bud-card-wants-lbl');
    if (cardWantsLbl) cardWantsLbl.textContent = `Discretionary Wants (${state.wantsPct}%)`;

    const cardWantsVal = container.querySelector('#bud-card-wants-val');
    if (cardWantsVal) cardWantsVal.textContent = formatCurrency(res.wantsAmount);

    const cardSavLbl = container.querySelector('#bud-card-sav-lbl');
    if (cardSavLbl) cardSavLbl.textContent = `Wealth Building (${state.savingsPct}%)`;

    const cardSavVal = container.querySelector('#bud-card-sav-val');
    if (cardSavVal) cardSavVal.textContent = formatCurrency(res.savingsAmount);

    const needsHint = container.querySelector('#bud-needs-hint');
    if (needsHint) needsHint.textContent = `${state.needsPct}% (${formatCurrency(res.needsAmount)})`;

    const wantsHint = container.querySelector('#bud-wants-hint');
    if (wantsHint) wantsHint.textContent = `${state.wantsPct}% (${formatCurrency(res.wantsAmount)})`;

    const savHint = container.querySelector('#bud-savings-hint');
    if (savHint) savHint.textContent = `${state.savingsPct}% (${formatCurrency(res.savingsAmount)})`;

    const breakdownBox = container.querySelector('#bud-breakdown-box');
    if (breakdownBox) {
      breakdownBox.innerHTML = `
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
      `;
    }

    // Render Donut
    const donutBox = container.querySelector('#budget-donut-box');
    if (donutBox) {
      renderDonutChart(donutBox, {
        segments: [
          { label: 'Needs', value: res.needsAmount, percent: state.needsPct, colorClass: 'principal' },
          { label: 'Wants', value: res.wantsAmount, percent: state.wantsPct, colorClass: 'interest' },
          { label: 'Savings', value: res.savingsAmount, percent: state.savingsPct, colorClass: 'extra' }
        ],
        centerLabel: 'Monthly Cash',
        centerValue: formatCurrency(state.monthlyIncome, undefined, false)
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

    bindInput('bud-income-input', 'bud-income-slider', 'bud-income-hint', (v) => { state.monthlyIncome = v; }, (v) => `${formatCurrency(v, undefined, false)} / mo`);
    bindInput('bud-needs-input', 'bud-needs-slider', null, (v) => {
      state.needsPct = v;
      rebalanceBudget('needs');
    });
    bindInput('bud-wants-input', 'bud-wants-slider', null, (v) => {
      state.wantsPct = v;
      rebalanceBudget('wants');
    });
    bindInput('bud-savings-input', 'bud-savings-slider', null, (v) => {
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
    // Update sliders and inputs without re-rendering the whole view
    const nInp = container.querySelector('#bud-needs-input');
    const nSld = container.querySelector('#bud-needs-slider');
    const wInp = container.querySelector('#bud-wants-input');
    const wSld = container.querySelector('#bud-wants-slider');
    const sInp = container.querySelector('#bud-savings-input');
    const sSld = container.querySelector('#bud-savings-slider');

    if (nInp && document.activeElement !== nInp) nInp.value = state.needsPct;
    if (nSld) nSld.value = state.needsPct;
    if (wInp && document.activeElement !== wInp) wInp.value = state.wantsPct;
    if (wSld) wSld.value = state.wantsPct;
    if (sInp && document.activeElement !== sInp) sInp.value = state.savingsPct;
    if (sSld) sSld.value = state.savingsPct;

    updateLive();
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
