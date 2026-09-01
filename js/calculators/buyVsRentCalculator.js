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
            <span class="savings-label">Financial Verdict at Year ${state.timeHorizonYears}</span>
            <span class="savings-amount">${res.winner === 'Buy' ? 'Buying' : 'Renting'} is Ahead by ${formatCurrency(res.netAdvantage)}</span>
          </div>
          <div class="savings-meta">
            <div class="savings-subitem">
              <span class="sub-label">Homeowner Net Equity</span>
              <span class="sub-val">${formatCurrency(res.finalBuyerNetWorth)}</span>
            </div>
            <div class="savings-subitem">
              <span class="sub-label">Renter Investment Portfolio</span>
              <span class="sub-val">${formatCurrency(res.finalRenterNetWorth)}</span>
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
                <span class="form-hint">${formatCurrency(state.homePrice, undefined, false)}</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="bvr-hp-input" class="form-input has-prefix" min="500000" max="50000000" step="50000" value="${state.homePrice}" />
              </div>
              <div class="slider-container">
                <input type="range" id="bvr-hp-slider" class="range-slider" min="1000000" max="20000000" step="50000" value="${Math.min(state.homePrice, 20000000)}" />
              </div>
            </div>

            <!-- Down Payment % -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-dp-input">Down Payment Percentage</label>
                <span class="form-hint">${state.downPaymentPct}% (${formatCurrency(res.initialDownPayment, undefined, false)})</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-dp-input" class="form-input has-suffix" min="0" max="60" step="5" value="${state.downPaymentPct}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Mortgage Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-mr-input">Mortgage Interest Rate</label>
                <span class="form-hint">${state.mortgageRate}%</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-mr-input" class="form-input has-suffix" min="1" max="18" step="0.1" value="${state.mortgageRate}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Home Appreciation Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-ha-input">Expected Property Appreciation</label>
                <span class="form-hint">${state.homeAppreciationRate}% / yr</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-ha-input" class="form-input has-suffix" min="0" max="15" step="0.5" value="${state.homeAppreciationRate}" />
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
                <span class="form-hint">${formatCurrency(state.monthlyRent, undefined, false)} / mo</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">${curr.symbol}</span>
                <input type="number" id="bvr-rent-input" class="form-input has-prefix" min="5000" max="300000" step="1000" value="${state.monthlyRent}" />
              </div>
              <div class="slider-container">
                <input type="range" id="bvr-rent-slider" class="range-slider" min="10000" max="100000" step="1000" value="${Math.min(state.monthlyRent, 100000)}" />
              </div>
            </div>

            <!-- Rent Inflation -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-ri-input">Annual Rent Inflation</label>
                <span class="form-hint">${state.rentInflationRate}% / yr</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-ri-input" class="form-input has-suffix" min="0" max="15" step="0.5" value="${state.rentInflationRate}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Market Return Rate -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-ir-input">Renter Stock Market Return</label>
                <span class="form-hint">${state.investmentReturnRate}% / yr</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-ir-input" class="form-input has-suffix" min="1" max="25" step="0.5" value="${state.investmentReturnRate}" />
                <span class="input-suffix">%</span>
              </div>
            </div>

            <!-- Time Horizon -->
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="bvr-th-input">Comparison Time Horizon</label>
                <span class="form-hint">${state.timeHorizonYears} Years</span>
              </div>
              <div class="input-wrapper">
                <input type="number" id="bvr-th-input" class="form-input has-suffix" min="3" max="30" step="1" value="${state.timeHorizonYears}" />
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
            <span class="panel-subtitle">Over ${state.timeHorizonYears} Years</span>
          </div>

          <div id="bvr-chart-box"></div>
        </div>
      </div>
    `;

    // Render Trajectory Chart
    const chartBox = container.querySelector('#bvr-chart-box');
    const origSched = res.trajectory.map((r) => ({ year: r.year, closingBalance: r.buyerEquity }));
    const revSched = res.trajectory.map((r) => ({ year: r.year, closingBalance: r.renterPortfolio }));

    renderComparisonChart(chartBox, {
      original: origSched,
      revised: revSched
    });

    attachEvents();
  }

  function attachEvents() {
    bindInput('bvr-hp-input', 'bvr-hp-slider', (v) => { state.homePrice = v; });
    bindNum('bvr-dp-input', (v) => { state.downPaymentPct = v; });
    bindNum('bvr-mr-input', (v) => { state.mortgageRate = v; });
    bindNum('bvr-ha-input', (v) => { state.homeAppreciationRate = v; });

    bindInput('bvr-rent-input', 'bvr-rent-slider', (v) => { state.monthlyRent = v; });
    bindNum('bvr-ri-input', (v) => { state.rentInflationRate = v; });
    bindNum('bvr-ir-input', (v) => { state.investmentReturnRate = v; });
    bindInput('bvr-th-input', 'bvr-th-slider', (v) => { state.timeHorizonYears = v; });

    const resetBtn = container.querySelector('#btn-reset-bvr');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }
  }

  function bindNum(id, setter) {
    const input = container.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('input', (e) => {
        const val = Math.max(0, Number(e.target.value) || 0);
        setter(val);
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
