/**
 * Finculator Wealth & Investment Suite (v2)
 * Sub-tabs: SIP, Lump Sum, SIP + Lump Sum Combined, Step-Up SIP, CAGR, Mutual Fund / Stock Returns
 * Calibrated for ₹200k/month salary earner (e.g. ₹25,000 / month SIP)
 */

import {
  calculateSIP,
  calculateLumpSum,
  calculateSIPLumpCombined,
  calculateStepUpSIP,
  calculateCAGR,
  calculateInvestmentReturns
} from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart, renderGrowthChart } from '../components/charts.js';
import { exportToCSV } from '../utils/export.js';

export function initInvestmentSuite(container) {
  if (!container) return;

  const defaultState = {
    activeTab: 'sip', // 'sip' | 'lump' | 'combined' | 'stepup' | 'cagr' | 'returns'
    // SIP (Default ₹25,000/mo)
    sipMonthly: 25000,
    sipRate: 12,
    sipYears: 15,
    // Lump Sum
    lumpPrincipal: 200000,
    lumpRate: 12,
    lumpYears: 10,
    // Combined
    combLump: 200000,
    combMonthly: 25000,
    combRate: 12,
    combYears: 15,
    // Step-Up
    stepMonthly: 25000,
    stepUpPct: 10,
    stepRate: 12,
    stepYears: 15,
    // CAGR
    cagrInitial: 100000,
    cagrFinal: 350000,
    cagrYears: 5,
    // Returns
    retInitial: 100000,
    retFinal: 250000,
    retDividends: 12000,
    retYears: 4
  };

  const state = getStoredState('investments', defaultState);

  function calculateActiveTab() {
    setStoredState('investments', state);
    const tab = state.activeTab;

    if (tab === 'sip') {
      return {
        type: 'sip',
        res: calculateSIP(state.sipMonthly, state.sipRate, state.sipYears)
      };
    } else if (tab === 'lump') {
      return {
        type: 'lump',
        res: calculateLumpSum(state.lumpPrincipal, state.lumpRate, state.lumpYears)
      };
    } else if (tab === 'combined') {
      return {
        type: 'combined',
        res: calculateSIPLumpCombined(state.combLump, state.combMonthly, state.combRate, state.combYears)
      };
    } else if (tab === 'stepup') {
      return {
        type: 'stepup',
        res: calculateStepUpSIP(state.stepMonthly, state.stepUpPct, state.stepRate, state.stepYears)
      };
    } else if (tab === 'cagr') {
      return {
        type: 'cagr',
        res: calculateCAGR(state.cagrInitial, state.cagrFinal, state.cagrYears)
      };
    } else {
      return {
        type: 'returns',
        res: calculateInvestmentReturns(state.retInitial, state.retFinal, state.retDividends, state.retYears)
      };
    }
  }

  function render() {
    const { type, res } = calculateActiveTab();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Wealth & Investment Suite</h1>
            <p class="calculator-desc">Forecast wealth accumulation across Systematic Investment Plans (SIP), Step-Up SIPs, Lump Sum deployments, CAGR metrics, and stock/fund returns.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-invest">Reset Defaults</button>
          </div>
        </div>

        <!-- Distinctly Bordered Sub-Tabs Bar -->
        <div class="tab-bar" id="invest-tab-bar">
          <button class="tab-btn ${state.activeTab === 'sip' ? 'active' : ''}" data-tab="sip">SIP (Recurring Plan)</button>
          <button class="tab-btn ${state.activeTab === 'lump' ? 'active' : ''}" data-tab="lump">Lump Sum</button>
          <button class="tab-btn ${state.activeTab === 'combined' ? 'active' : ''}" data-tab="combined">SIP + Lump Sum</button>
          <button class="tab-btn ${state.activeTab === 'stepup' ? 'active' : ''}" data-tab="stepup">Step-Up SIP</button>
          <button class="tab-btn ${state.activeTab === 'cagr' ? 'active' : ''}" data-tab="cagr">CAGR Calculator</button>
          <button class="tab-btn ${state.activeTab === 'returns' ? 'active' : ''}" data-tab="returns">Fund & Stock Returns</button>
        </div>

        <div class="calc-grid">
          <!-- Section 1: Inputs Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                ${getTabTitle(state.activeTab)} Parameters
              </span>
              <span class="panel-subtitle">MARKET YIELD ASSUMPTIONS</span>
            </div>
            ${renderTabInputs(state.activeTab, curr)}
          </div>

          <!-- Section 2: Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Accumulation Summary
              </span>
              <span class="panel-subtitle">COMPOUNDED PERFORMANCE</span>
            </div>

            ${renderTabMetrics(type, res, curr)}

            <!-- Donut Chart (if applicable) -->
            ${(type !== 'cagr' && type !== 'returns') ? '<div id="invest-donut-chart-box"></div>' : ''}
          </div>
        </div>

        <!-- Milestone Timeline & Schedule (if available) -->
        ${renderScheduleSection(type, res)}
      </div>
    `;

    // Render Donut
    if (type !== 'cagr' && type !== 'returns') {
      const donutBox = container.querySelector('#invest-donut-chart-box');
      if (donutBox) {
        const inv = res.totalInvested || res.initialInvestment || 0;
        const ret = res.estimatedReturns || 0;
        const tot = res.futureValue || 1;
        const invPct = Math.round((inv / tot) * 100);
        const retPct = 100 - invPct;

        renderDonutChart(donutBox, {
          segments: [
            { label: 'Capital Invested', value: inv, percent: invPct, colorClass: 'principal' },
            { label: 'Returns Generated', value: ret, percent: retPct, colorClass: 'interest' }
          ],
          centerLabel: 'Total Wealth',
          centerValue: formatCurrency(tot, undefined, false)
        });
      }
    }

    // Render Growth Area Chart
    const growthBox = container.querySelector('#invest-growth-chart-box');
    if (growthBox && res.yearlyBreakdown && res.yearlyBreakdown.length > 0) {
      const chartData = res.yearlyBreakdown.map((row) => ({
        year: row.year,
        invested: row.totalInvested || row.invested || 0,
        total: row.futureValue || 0
      }));
      renderGrowthChart(growthBox, {
        data: chartData,
        primaryLabel: 'Total Wealth Value',
        secondaryLabel: 'Capital Invested'
      });
    }

    attachEvents();
  }

  function getTabTitle(tab) {
    switch (tab) {
      case 'sip': return 'SIP';
      case 'lump': return 'Lump Sum';
      case 'combined': return 'SIP + Lump Sum';
      case 'stepup': return 'Step-Up SIP';
      case 'cagr': return 'CAGR';
      case 'returns': return 'Returns Analysis';
      default: return 'Investment';
    }
  }

  function renderTabInputs(tab, curr) {
    if (tab === 'sip') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sip-m-input">Monthly SIP Contribution</label>
            <span class="form-hint">${formatCurrency(state.sipMonthly, undefined, false)} / mo</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sip-m-input" class="form-input has-prefix" min="500" max="1000000" step="500" value="${state.sipMonthly}" />
          </div>
          <div class="slider-container">
            <input type="range" id="sip-m-slider" class="range-slider" min="1000" max="100000" step="500" value="${Math.min(state.sipMonthly, 100000)}" />
          </div>
          <div class="slider-limits">
            <span>₹1,000 / mo</span>
            <span>₹25,000 / mo (Target)</span>
            <span>₹100,000 / mo</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sip-r-input">Expected Annual Equity Return</label>
            <span class="form-hint">${state.sipRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sip-r-input" class="form-input has-suffix" min="1" max="30" step="0.1" value="${state.sipRate}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sip-r-slider" class="range-slider" min="6" max="20" step="0.5" value="${state.sipRate}" />
          </div>
          <div class="slider-limits">
            <span>6% (Conservative)</span>
            <span>12% (Nifty 50)</span>
            <span>20% (Aggressive)</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sip-y-input">Investment Horizon</label>
            <span class="form-hint">${state.sipYears} Years (${state.sipYears * 12} Installments)</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sip-y-input" class="form-input has-suffix" min="1" max="40" step="1" value="${state.sipYears}" />
            <span class="input-suffix">Years</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sip-y-slider" class="range-slider" min="1" max="35" step="1" value="${state.sipYears}" />
          </div>
        </div>
      `;
    } else if (tab === 'lump') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="lump-p-input">Lump Sum Deployment Amount</label>
            <span class="form-hint">${formatCurrency(state.lumpPrincipal, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="lump-p-input" class="form-input has-prefix" min="1000" max="10000000" step="5000" value="${state.lumpPrincipal}" />
          </div>
          <div class="slider-container">
            <input type="range" id="lump-p-slider" class="range-slider" min="10000" max="2000000" step="10000" value="${Math.min(state.lumpPrincipal, 2000000)}" />
          </div>
          <div class="slider-limits">
            <span>₹10,000</span>
            <span>₹2,00,000</span>
            <span>₹20 Lakhs</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="lump-r-input">Expected Annual Return</label>
            <span class="form-hint">${state.lumpRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="lump-r-input" class="form-input has-suffix" min="1" max="30" step="0.1" value="${state.lumpRate}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="lump-r-slider" class="range-slider" min="5" max="22" step="0.5" value="${state.lumpRate}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="lump-y-input">Time Horizon</label>
            <span class="form-hint">${state.lumpYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="lump-y-input" class="form-input has-suffix" min="1" max="40" step="1" value="${state.lumpYears}" />
            <span class="input-suffix">Years</span>
          </div>
          <div class="slider-container">
            <input type="range" id="lump-y-slider" class="range-slider" min="1" max="35" step="1" value="${state.lumpYears}" />
          </div>
        </div>
      `;
    } else if (tab === 'combined') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="comb-l-input">Initial Lump Sum Capital</label>
            <span class="form-hint">${formatCurrency(state.combLump, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="comb-l-input" class="form-input has-prefix" min="0" max="5000000" step="10000" value="${state.combLump}" />
          </div>
          <div class="slider-container">
            <input type="range" id="comb-l-slider" class="range-slider" min="0" max="1000000" step="10000" value="${Math.min(state.combLump, 1000000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="comb-m-input">Monthly Recurring Contribution</label>
            <span class="form-hint">${formatCurrency(state.combMonthly, undefined, false)} / mo</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="comb-m-input" class="form-input has-prefix" min="500" max="500000" step="500" value="${state.combMonthly}" />
          </div>
          <div class="slider-container">
            <input type="range" id="comb-m-slider" class="range-slider" min="500" max="50000" step="500" value="${Math.min(state.combMonthly, 50000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="comb-r-input">Expected Annual Return</label>
            <span class="form-hint">${state.combRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="comb-r-input" class="form-input has-suffix" min="1" max="30" step="0.1" value="${state.combRate}" />
            <span class="input-suffix">%</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="comb-y-input">Time Horizon</label>
            <span class="form-hint">${state.combYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="comb-y-input" class="form-input has-suffix" min="1" max="40" step="1" value="${state.combYears}" />
            <span class="input-suffix">Years</span>
          </div>
        </div>
      `;
    } else if (tab === 'stepup') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="step-m-input">Initial Monthly Deposit</label>
            <span class="form-hint">${formatCurrency(state.stepMonthly, undefined, false)} / mo</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="step-m-input" class="form-input has-prefix" min="500" max="500000" step="500" value="${state.stepMonthly}" />
          </div>
          <div class="slider-container">
            <input type="range" id="step-m-slider" class="range-slider" min="1000" max="50000" step="500" value="${Math.min(state.stepMonthly, 50000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="step-u-input">Annual Step-Up Percentage</label>
            <span class="form-hint">+${state.stepUpPct}% annual salary hike match</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="step-u-input" class="form-input has-suffix" min="1" max="50" step="1" value="${state.stepUpPct}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="step-u-slider" class="range-slider" min="5" max="25" step="1" value="${state.stepUpPct}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="step-r-input">Expected Annual Return</label>
            <span class="form-hint">${state.stepRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="step-r-input" class="form-input has-suffix" min="1" max="30" step="0.1" value="${state.stepRate}" />
            <span class="input-suffix">%</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="step-y-input">Time Horizon</label>
            <span class="form-hint">${state.stepYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="step-y-input" class="form-input has-suffix" min="1" max="40" step="1" value="${state.stepYears}" />
            <span class="input-suffix">Years</span>
          </div>
        </div>
      `;
    } else if (tab === 'cagr') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="cagr-i-input">Initial Investment Capital</label>
            <span class="form-hint">${formatCurrency(state.cagrInitial, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="cagr-i-input" class="form-input has-prefix" min="100" max="50000000" step="5000" value="${state.cagrInitial}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="cagr-f-input">Current Realized Portfolio Value</label>
            <span class="form-hint">${formatCurrency(state.cagrFinal, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="cagr-f-input" class="form-input has-prefix" min="100" max="100000000" step="5000" value="${state.cagrFinal}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="cagr-y-input">Holding Duration (Years)</label>
            <span class="form-hint">${state.cagrYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="cagr-y-input" class="form-input has-suffix" min="0.1" max="50" step="0.5" value="${state.cagrYears}" />
            <span class="input-suffix">Years</span>
          </div>
        </div>
      `;
    } else {
      // Returns
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="ret-i-input">Initial Purchase Cost Basis</label>
            <span class="form-hint">${formatCurrency(state.retInitial, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="ret-i-input" class="form-input has-prefix" min="100" max="50000000" step="5000" value="${state.retInitial}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="ret-f-input">Current Valuation / Sale Proceeds</label>
            <span class="form-hint">${formatCurrency(state.retFinal, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="ret-f-input" class="form-input has-prefix" min="0" max="100000000" step="5000" value="${state.retFinal}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="ret-d-input">Dividends & Payouts Received</label>
            <span class="form-hint">+${formatCurrency(state.retDividends, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="ret-d-input" class="form-input has-prefix" min="0" max="5000000" step="500" value="${state.retDividends}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="ret-y-input">Holding Period</label>
            <span class="form-hint">${state.retYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="ret-y-input" class="form-input has-suffix" min="0.1" max="40" step="0.5" value="${state.retYears}" />
            <span class="input-suffix">Years</span>
          </div>
        </div>
      `;
    }
  }

  function renderTabMetrics(type, res, curr) {
    if (type === 'cagr') {
      return `
        <div class="hero-metric-box">
          <span class="metric-label">Compound Annual Growth Rate (CAGR)</span>
          <span class="metric-value">${res.cagr}%</span>
          <span class="metric-subtext">Annualized compound return rate over ${state.cagrYears} years</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card highlight">
            <span class="metric-label">Absolute Gain</span>
            <span class="metric-value">${formatCurrency(res.absoluteGain)}</span>
            <span class="metric-subtext">Net nominal profit</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Total Percentage Return</span>
            <span class="metric-value">${res.totalReturnPercent}%</span>
            <span class="metric-subtext">Absolute point-to-point yield</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Growth Multiple</span>
            <span class="metric-value">${(res.finalValue / res.initialValue).toFixed(2)}x</span>
            <span class="metric-subtext">Capital expansion ratio</span>
          </div>
        </div>
      `;
    }

    if (type === 'returns') {
      return `
        <div class="hero-metric-box">
          <span class="metric-label">Annualized Return (CAGR)</span>
          <span class="metric-value">${res.annualizedReturn}%</span>
          <span class="metric-subtext">Compounded annual return including dividends</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card highlight">
            <span class="metric-label">Total Net Profit</span>
            <span class="metric-value">${formatCurrency(res.netProfit)}</span>
            <span class="metric-subtext">Capital gain + ${formatCurrency(res.dividends)} dividends</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Absolute Return</span>
            <span class="metric-value">${res.absoluteReturn}%</span>
            <span class="metric-subtext">Total period gain</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Total Value</span>
            <span class="metric-value">${formatCurrency(res.finalValue + res.dividends)}</span>
            <span class="metric-subtext">Ending gross proceeds</span>
          </div>
        </div>
      `;
    }

    const fv = res.futureValue || 0;
    const inv = res.totalInvested || res.initialInvestment || 0;
    const ret = res.estimatedReturns || 0;
    const mult = res.wealthGainMultiple || 1;

    return `
      <div class="hero-metric-box">
        <span class="metric-label">Projected Portfolio Value</span>
        <span class="metric-value">${formatCurrency(fv)}</span>
        <span class="metric-subtext">Total accumulated wealth after compound growth</span>
      </div>

      <div class="summary-grid">
        <div class="summary-card highlight">
          <span class="metric-label">Capital Invested</span>
          <span class="metric-value">${formatCurrency(inv)}</span>
          <span class="metric-subtext">Total deposits funded</span>
        </div>
        <div class="summary-card">
          <span class="metric-label">Estimated Gains</span>
          <span class="metric-value">${formatCurrency(ret)}</span>
          <span class="metric-subtext">Compound profit generated</span>
        </div>
        <div class="summary-card">
          <span class="metric-label">Wealth Multiple</span>
          <span class="metric-value">${mult}x</span>
          <span class="metric-subtext">Capital multiplier</span>
        </div>
      </div>
    `;
  }

  function renderScheduleSection(type, res) {
    if (!res.yearlyBreakdown || res.yearlyBreakdown.length === 0) return '';

    return `
      <div class="panel" style="margin-top: 1.5rem;">
        <div class="panel-header">
          <span class="panel-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            Growth Trajectory & Milestone Schedule
          </span>
          <button class="btn btn-secondary btn-sm" id="btn-export-inv-csv">Export CSV</button>
        </div>
        <div id="invest-growth-chart-box"></div>

        <div class="table-wrapper" style="margin-top: 1.25rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Invested Capital</th>
                <th>Estimated Gains</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${res.yearlyBreakdown.map((r) => `
                <tr>
                  <td><strong>Year ${r.year}</strong></td>
                  <td>${formatCurrency(r.totalInvested || r.invested || 0)}</td>
                  <td>${formatCurrency(r.returns || 0)}</td>
                  <td><strong>${formatCurrency(r.futureValue || 0)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function attachEvents() {
    const tabBtns = container.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-tab');
        render();
      });
    });

    const resetBtn = container.querySelector('#btn-reset-invest');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }

    const csvBtn = container.querySelector('#btn-export-inv-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const { type, res } = calculateActiveTab();
        const headers = ['Year', 'Invested Capital', 'Returns', 'Portfolio Value'];
        const rows = (res.yearlyBreakdown || []).map((r) => [
          `Year ${r.year}`,
          r.totalInvested || r.invested || 0,
          r.returns || 0,
          r.futureValue || 0
        ]);
        exportToCSV(`investment_schedule_${state.activeTab}`, headers, rows);
      });
    }

    if (state.activeTab === 'sip') {
      bindInput('sip-m-input', 'sip-m-slider', (v) => { state.sipMonthly = v; });
      bindInput('sip-r-input', 'sip-r-slider', (v) => { state.sipRate = v; });
      bindInput('sip-y-input', 'sip-y-slider', (v) => { state.sipYears = v; });
    } else if (state.activeTab === 'lump') {
      bindInput('lump-p-input', 'lump-p-slider', (v) => { state.lumpPrincipal = v; });
      bindInput('lump-r-input', 'lump-r-slider', (v) => { state.lumpRate = v; });
      bindInput('lump-y-input', 'lump-y-slider', (v) => { state.lumpYears = v; });
    } else if (state.activeTab === 'combined') {
      bindInput('comb-l-input', 'comb-l-slider', (v) => { state.combLump = v; });
      bindInput('comb-m-input', 'comb-m-slider', (v) => { state.combMonthly = v; });
      const rInp = container.querySelector('#comb-r-input');
      if (rInp) rInp.addEventListener('input', (e) => { state.combRate = Math.max(0, Number(e.target.value) || 0); render(); });
      const yInp = container.querySelector('#comb-y-input');
      if (yInp) yInp.addEventListener('input', (e) => { state.combYears = Math.max(1, Number(e.target.value) || 1); render(); });
    } else if (state.activeTab === 'stepup') {
      bindInput('step-m-input', 'step-m-slider', (v) => { state.stepMonthly = v; });
      bindInput('step-u-input', 'step-u-slider', (v) => { state.stepUpPct = v; });
      const rInp = container.querySelector('#step-r-input');
      if (rInp) rInp.addEventListener('input', (e) => { state.stepRate = Math.max(0, Number(e.target.value) || 0); render(); });
      const yInp = container.querySelector('#step-y-input');
      if (yInp) yInp.addEventListener('input', (e) => { state.stepYears = Math.max(1, Number(e.target.value) || 1); render(); });
    } else if (state.activeTab === 'cagr') {
      const iInp = container.querySelector('#cagr-i-input');
      if (iInp) iInp.addEventListener('input', (e) => { state.cagrInitial = Math.max(0, Number(e.target.value) || 0); render(); });
      const fInp = container.querySelector('#cagr-f-input');
      if (fInp) fInp.addEventListener('input', (e) => { state.cagrFinal = Math.max(0, Number(e.target.value) || 0); render(); });
      const yInp = container.querySelector('#cagr-y-input');
      if (yInp) yInp.addEventListener('input', (e) => { state.cagrYears = Math.max(0.1, Number(e.target.value) || 0.1); render(); });
    } else {
      const iInp = container.querySelector('#ret-i-input');
      if (iInp) iInp.addEventListener('input', (e) => { state.retInitial = Math.max(0, Number(e.target.value) || 0); render(); });
      const fInp = container.querySelector('#ret-f-input');
      if (fInp) fInp.addEventListener('input', (e) => { state.retFinal = Math.max(0, Number(e.target.value) || 0); render(); });
      const dInp = container.querySelector('#ret-d-input');
      if (dInp) dInp.addEventListener('input', (e) => { state.retDividends = Math.max(0, Number(e.target.value) || 0); render(); });
      const yInp = container.querySelector('#ret-y-input');
      if (yInp) yInp.addEventListener('input', (e) => { state.retYears = Math.max(0.1, Number(e.target.value) || 0.1); render(); });
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
