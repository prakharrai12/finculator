/**
 * Finculator Buy vs. Rent Comparison Calculator
 * Long-term wealth comparison: Homeowner equity accumulation vs Renter investment portfolio
 */

import { calculateBuyVsRent } from '../math/financeMath.js';
import { formatCurrency, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderComparisonChart } from '../components/charts.js';

export function initBuyVsRentCalculator(container) {
  if (!container) return;

  const defaultState = {
    homePrice: 7500000,
    downPaymentPct: 20,
    mortgageRate: 8.5,
    mortgageYears: 20,
    homeAppreciationRate: 5.0,
    monthlyRent: 25000,
    rentInflationRate: 5.0,
    investmentReturnRate: 12.0,
    timeHorizonYears: 15
  };

  const state = getStoredState('buy_vs_rent', defaultState);

  function calculate() {
    const res = calculateBuyVsRent(
      state.homePrice,
      state.downPaymentPct,
      state.mortgageRate,
      state.mortgageYears,
      state.homeAppreciationRate,
      state.monthlyRent,
      state.rentInflationRate,
      state.investmentReturnRate,
      state.timeHorizonYears
    );
    setStoredState('buy_vs_rent', state);
    return res;
  }

  function render() {
    const res = calculate();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Buy vs. Rent Comparison Calculator</h1>
            <p class="calculator-desc">Evaluate the long-term wealth trajectory between purchasing a home (equity & appreciation) vs renting and investing the down payment and monthly cash flow differential in the market.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-bvr">Reset Defaults</button>
          </div>
        </div>

        <!-- High-Impact Outcome Banner -->
        <div class="savings-banner">
          <div class="savings-info">
            <span class="savings-label" id="bvr-verdict-label">Financial Verdict at Year ${state.timeHorizonYears}</span>
            <span class="savings-amount" id="bvr-verdict-amt">${res.winner === 'Buy' ? 'Buying' : 'Renting'} is Ahead by ${formatCurrency(res.netAdvantage)}</span>
          </div>
          <div class="savings-meta">
            <div class="savings-subitem">
              <span class="sub-label">Homeowner Net Equity</span>
              <span class="sub-val" id="bvr-buyer-nw">${formatCurrency(res.finalBuyerNetWorth)}</span>
            </div>
            <div class="savings-subitem">
              <span class="sub-label">Renter Investment Portfolio</span>
              <span class="sub-val" id="bvr-renter-nw">${formatCurrency(res.finalRenterNetWorth)}</span>
            </div>
          </div>
        </div>

        <div class="calc-grid">
          <!-- Buy Parameters Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Home Purchase Scenario</span>
              <span class="panel-subtitle">Acquisition & mortgage parameters</span>
            </div>

            <!-- Home Price -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-hp-input">Home Purchase Price</label>
                <span class="form-hint" id="bvr-hp-hint">${formatCurrency(state.homePrice, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="bvr-hp-input" class="form-input has-prefix" min="0" max="50000000" step="50000" placeholder="0" value="${state.homePrice}" />
              </div>
              <div class="slider-container">
                <input type="range" id="bvr-hp-slider" class="range-slider" min="1000000" max="20000000" step="50000" value="${Math.min(state.homePrice, 20000000)}" />
              </div>
            </div>

            <!-- Down Payment % -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-dp-input">Down Payment Percentage</label>
                <span class="form-hint" id="bvr-dp-hint">${state.downPaymentPct}% (${formatCurrency(res.initialDownPayment, undefined, false)})</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-dp-input" class="form-input has-suffix" min="0" max="90" step="5" placeholder="20" value="${state.downPaymentPct}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Mortgage Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-mr-input">Mortgage Interest Rate</label>
                <span class="form-hint" id="bvr-mr-hint">${state.mortgageRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-mr-input" class="form-input has-suffix" min="0" max="25" step="0.1" placeholder="8.5" value="${state.mortgageRate}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Home Appreciation Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-ha-input">Expected Property Appreciation</label>
                <span class="form-hint" id="bvr-ha-hint">${state.homeAppreciationRate}% / yr</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-ha-input" class="form-input has-suffix" min="0" max="20" step="0.5" placeholder="5" value="${state.homeAppreciationRate}" />
                <span class="input-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Rent & Invest Scenario Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Rental & Market Scenario</span>
              <span class="panel-subtitle">Alternative investment yields</span>
            </div>

            <!-- Monthly Rent -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-rent-input">Starting Monthly Rent</label>
                <span class="form-hint" id="bvr-rent-hint">${formatCurrency(state.monthlyRent, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="bvr-rent-input" class="form-input has-prefix" min="0" max="300000" step="1000" placeholder="0" value="${state.monthlyRent}" />
              </div>
              <div class="slider-container">
                <input type="range" id="bvr-rent-slider" class="range-slider" min="10000" max="100000" step="1000" value="${Math.min(state.monthlyRent, 100000)}" />
              </div>
            </div>

            <!-- Rent Inflation -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-ri-input">Annual Rent Inflation</label>
                <span class="form-hint" id="bvr-ri-hint">${state.rentInflationRate}% / yr</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-ri-input" class="form-input has-suffix" min="0" max="20" step="0.5" placeholder="5" value="${state.rentInflationRate}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Market Return Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-ir-input">Renter Stock Market Return</label>
                <span class="form-hint" id="bvr-ir-hint">${state.investmentReturnRate}% / yr</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-ir-input" class="form-input has-suffix" min="0" max="30" step="0.5" placeholder="12" value="${state.investmentReturnRate}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Time Horizon -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-th-input">Comparison Time Horizon</label>
                <span class="form-hint" id="bvr-th-hint">${state.timeHorizonYears} Years</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-th-input" class="form-input has-suffix" min="1" max="40" step="1" placeholder="15" value="${state.timeHorizonYears}" />
                <span class="input-suffix">Years</span>
              </div>
              <div class="slider-container">
                <input type="range" id="bvr-th-slider" class="range-slider" min="5" max="30" step="1" value="${state.timeHorizonYears}" />
              </div>
            </div>
          </div>
        </div>

        <!-- Trajectory Chart Panel -->
        <div class="panel" style="margin-top: 1.5rem;">
          <div class="panel-header">
            <span class="panel-title">Cumulative Wealth Trajectory: Home Equity vs Renter Portfolio</span>
            <span class="panel-subtitle" id="bvr-chart-sub">Over ${state.timeHorizonYears} Years</span>
          </div>

          <div id="bvr-chart-box"></div>
        </div>
      </div>
    `;

    updateOutputs(res);
    attachEvents();
  }

  function updateOutputs(res) {
    const verdictLbl = container.querySelector('#bvr-verdict-label');
    if (verdictLbl) verdictLbl.textContent = `Financial Verdict at Year ${state.timeHorizonYears}`;

    const verdictAmt = container.querySelector('#bvr-verdict-amt');
    if (verdictAmt) verdictAmt.textContent = `${res.winner === 'Buy' ? 'Buying' : 'Renting'} is Ahead by ${formatCurrency(res.netAdvantage)}`;

    const buyerNw = container.querySelector('#bvr-buyer-nw');
    if (buyerNw) buyerNw.textContent = formatCurrency(res.finalBuyerNetWorth);

    const renterNw = container.querySelector('#bvr-renter-nw');
    if (renterNw) renterNw.textContent = formatCurrency(res.finalRenterNetWorth);

    const dpHint = container.querySelector('#bvr-dp-hint');
    if (dpHint) dpHint.textContent = `${state.downPaymentPct}% (${formatCurrency(res.initialDownPayment, undefined, false)})`;

    const chartSub = container.querySelector('#bvr-chart-sub');
    if (chartSub) chartSub.textContent = `Over ${state.timeHorizonYears} Years`;

    // Render Trajectory Chart
    const chartBox = container.querySelector('#bvr-chart-box');
    if (chartBox) {
      const origSched = res.trajectory.map((r) => ({ year: r.year, closingBalance: r.buyerEquity }));
      const revSched = res.trajectory.map((r) => ({ year: r.year, closingBalance: r.renterPortfolio }));

      renderComparisonChart(chartBox, {
        original: origSched,
        revised: revSched
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

    bindInput('bvr-hp-input', 'bvr-hp-slider', 'bvr-hp-hint', (v) => { state.homePrice = v; }, (v) => formatCurrency(v, undefined, false));
    bindNum('bvr-dp-input', 'bvr-dp-hint', (v) => { state.downPaymentPct = v; }, (v) => `${v}%`);
    bindNum('bvr-mr-input', 'bvr-mr-hint', (v) => { state.mortgageRate = v; }, (v) => `${v}%`);
    bindNum('bvr-ha-input', 'bvr-ha-hint', (v) => { state.homeAppreciationRate = v; }, (v) => `${v}% / yr`);

    bindInput('bvr-rent-input', 'bvr-rent-slider', 'bvr-rent-hint', (v) => { state.monthlyRent = v; }, (v) => `${formatCurrency(v, undefined, false)} / mo`);
    bindNum('bvr-ri-input', 'bvr-ri-hint', (v) => { state.rentInflationRate = v; }, (v) => `${v}% / yr`);
    bindNum('bvr-ir-input', 'bvr-ir-hint', (v) => { state.investmentReturnRate = v; }, (v) => `${v}% / yr`);
    bindInput('bvr-th-input', 'bvr-th-slider', 'bvr-th-hint', (v) => { state.timeHorizonYears = v; }, (v) => `${v} Years`);

    const resetBtn = container.querySelector('#btn-reset-bvr');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.homePrice = 0;
        state.downPaymentPct = 0;
        state.mortgageRate = 0;
        state.homeAppreciationRate = 0;
        state.monthlyRent = 0;
        state.rentInflationRate = 0;
        state.investmentReturnRate = 0;
        state.timeHorizonYears = 0;
        setStoredState('buy_vs_rent', state);
        render();
      });
    }
  }

  function bindNum(id, hintId, setter, hintFormatter) {
    const input = container.querySelector(`#${id}`);
    const hint = hintId ? container.querySelector(`#${hintId}`) : null;
    if (input) {
      input.addEventListener('input', (e) => {
        const raw = e.target.value;
        const val = raw === '' ? 0 : Math.max(0, Number(raw));
        setter(val);
        if (hint && hintFormatter) hint.textContent = hintFormatter(val);
        updateLive();
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
