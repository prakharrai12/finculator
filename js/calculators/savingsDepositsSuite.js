/**
 * Finculator Savings & Deposits Suite
 * Sub-tabs: Compound Interest, Simple Interest, Fixed Deposit (FD), Recurring Deposit (RD), PPF, Goal-Based Savings
 */

import {
  calculateCompoundInterest,
  calculateSimpleInterest,
  calculateFixedDeposit,
  calculateRecurringDeposit,
  calculatePPF,
  calculateGoalSavings
} from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart, renderGrowthChart } from '../components/charts.js';
import { exportToCSV } from '../utils/export.js';

export function initSavingsDepositsSuite(container) {
  if (!container) return;

  const defaultState = {
    activeTab: 'compound', // 'compound' | 'simple' | 'fd' | 'rd' | 'ppf' | 'goal'
    // Compound
    compoundPrincipal: 25000,
    compoundRate: 7.5,
    compoundYears: 10,
    compoundFrequency: 'quarterly',
    compoundRecurring: 100,
    // Simple
    simplePrincipal: 15000,
    simpleRate: 6.0,
    simpleYears: 5,
    // FD
    fdPrincipal: 50000,
    fdRate: 7.25,
    fdMonths: 36,
    fdFrequency: 'quarterly',
    // RD
    rdMonthly: 500,
    rdRate: 6.8,
    rdMonths: 36,
    // PPF
    ppfAnnual: 150000,
    ppfYears: 15,
    ppfRate: 7.1,
    // Goal
    goalCorpus: 200000,
    goalYears: 10,
    goalReturn: 8.5,
    goalInitial: 10000
  };

  const state = getStoredState('savings_deposits', defaultState);

  function calculateActiveTab() {
    setStoredState('savings_deposits', state);
    const tab = state.activeTab;

    if (tab === 'compound') {
      return {
        type: 'compound',
        res: calculateCompoundInterest(
          state.compoundPrincipal,
          state.compoundRate,
          state.compoundYears,
          state.compoundFrequency,
          state.compoundRecurring
        )
      };
    } else if (tab === 'simple') {
      return {
        type: 'simple',
        res: calculateSimpleInterest(state.simplePrincipal, state.simpleRate, state.simpleYears)
      };
    } else if (tab === 'fd') {
      return {
        type: 'fd',
        res: calculateFixedDeposit(state.fdPrincipal, state.fdRate, state.fdMonths, state.fdFrequency)
      };
    } else if (tab === 'rd') {
      return {
        type: 'rd',
        res: calculateRecurringDeposit(state.rdMonthly, state.rdRate, state.rdMonths)
      };
    } else if (tab === 'ppf') {
      return {
        type: 'ppf',
        res: calculatePPF(state.ppfAnnual, state.ppfYears, state.ppfRate)
      };
    } else {
      return {
        type: 'goal',
        res: calculateGoalSavings(state.goalCorpus, state.goalYears, state.goalReturn, state.goalInitial)
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
            <h1 class="calculator-title">Savings & Deposits Suite</h1>
            <p class="calculator-desc">Model guaranteed banking products, compound growth curves, fixed/recurring deposits, sovereign savings schemes, and target goal funding.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-savings">Reset Defaults</button>
          </div>
        </div>

        <!-- Sub Tabs Bar -->
        <div class="tab-bar" id="savings-tab-bar">
          <button class="tab-btn ${state.activeTab === 'compound' ? 'active' : ''}" data-tab="compound">Compound Interest</button>
          <button class="tab-btn ${state.activeTab === 'simple' ? 'active' : ''}" data-tab="simple">Simple Interest</button>
          <button class="tab-btn ${state.activeTab === 'fd' ? 'active' : ''}" data-tab="fd">Fixed Deposit (FD)</button>
          <button class="tab-btn ${state.activeTab === 'rd' ? 'active' : ''}" data-tab="rd">Recurring Deposit (RD)</button>
          <button class="tab-btn ${state.activeTab === 'ppf' ? 'active' : ''}" data-tab="ppf">PPF (Tax-Free Savings)</button>
          <button class="tab-btn ${state.activeTab === 'goal' ? 'active' : ''}" data-tab="goal">Goal-Based Savings</button>
        </div>

        <div class="calc-grid">
          <!-- Input Controls Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">${getTabTitle(state.activeTab)} Parameters</span>
              <span class="panel-subtitle">Deposit assumptions</span>
            </div>
            ${renderTabInputs(state.activeTab, curr)}
          </div>

          <!-- Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Maturity & Returns Summary</span>
              <span class="panel-subtitle">Yield breakdown</span>
            </div>

            ${renderTabMetrics(type, res, curr)}

            <!-- Donut Breakdown -->
            <div id="savings-donut-box"></div>
          </div>
        </div>

        <!-- Growth Schedule & Table (if applicable) -->
        ${renderScheduleSection(type, res)}
      </div>
    `;

    // Render Donut
    const donutBox = container.querySelector('#savings-donut-box');
    const { princ, int, total } = getDonutValues(type, res);
    const princPct = total > 0 ? Math.round((princ / total) * 100) : 100;
    const intPct = 100 - princPct;

    renderDonutChart(donutBox, {
      segments: [
        { label: 'Principal Deposits', value: princ, percent: princPct, colorClass: 'principal' },
        { label: 'Interest Earnings', value: int, percent: intPct, colorClass: 'interest' }
      ],
      centerLabel: 'Maturity Value',
      centerValue: formatCurrency(total, undefined, false)
    });

    // Render Chart if table section exists
    const chartBox = container.querySelector('#savings-growth-chart-box');
    if (chartBox && (res.yearlyBreakdown || res.trajectory)) {
      const chartData = (res.yearlyBreakdown || []).map((row) => ({
        year: row.year,
        invested: row.totalDeposits || row.invested || 0,
        total: row.balance || row.closingBalance || 0
      }));
      renderGrowthChart(chartBox, {
        data: chartData,
        primaryLabel: 'Total Balance',
        secondaryLabel: 'Cumulative Deposits'
      });
    }

    attachEvents();
  }

  function getTabTitle(tab) {
    switch (tab) {
      case 'compound': return 'Compound Interest';
      case 'simple': return 'Simple Interest';
      case 'fd': return 'Fixed Deposit';
      case 'rd': return 'Recurring Deposit';
      case 'ppf': return 'PPF';
      case 'goal': return 'Goal Savings';
      default: return 'Savings';
    }
  }

  function renderTabInputs(tab, curr) {
    if (tab === 'compound') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-c-p-input">Initial Deposit</label>
            <span class="form-hint">${formatCurrency(state.compoundPrincipal, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-c-p-input" class="form-input has-prefix" min="100" max="5000000" step="500" value="${state.compoundPrincipal}" />
          </div>
          <div class="slider-container">
            <input type="range" id="sd-c-p-slider" class="range-slider" min="1000" max="200000" step="500" value="${Math.min(state.compoundPrincipal, 200000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-c-r-input">Annual Interest Rate</label>
            <span class="form-hint">${state.compoundRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-c-r-input" class="form-input has-suffix" min="0.1" max="25" step="0.1" value="${state.compoundRate}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-c-r-slider" class="range-slider" min="1" max="15" step="0.1" value="${state.compoundRate}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-c-freq-select">Compounding Frequency</label>
          </div>
          <select id="sd-c-freq-select" class="form-input">
            <option value="annually" ${state.compoundFrequency === 'annually' ? 'selected' : ''}>Annually (1/yr)</option>
            <option value="semiannually" ${state.compoundFrequency === 'semiannually' ? 'selected' : ''}>Semi-Annually (2/yr)</option>
            <option value="quarterly" ${state.compoundFrequency === 'quarterly' ? 'selected' : ''}>Quarterly (4/yr)</option>
            <option value="monthly" ${state.compoundFrequency === 'monthly' ? 'selected' : ''}>Monthly (12/yr)</option>
            <option value="daily" ${state.compoundFrequency === 'daily' ? 'selected' : ''}>Daily (365/yr)</option>
          </select>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-c-t-input">Investment Horizon</label>
            <span class="form-hint">${state.compoundYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-c-t-input" class="form-input has-suffix" min="1" max="40" step="1" value="${state.compoundYears}" />
            <span class="input-suffix">Years</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-c-t-slider" class="range-slider" min="1" max="30" step="1" value="${state.compoundYears}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-c-rec-input">Optional Monthly Add-On Deposit</label>
            <span class="form-hint">+${formatCurrency(state.compoundRecurring, undefined, false)} / mo</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-c-rec-input" class="form-input has-prefix" min="0" max="50000" step="50" value="${state.compoundRecurring}" />
          </div>
        </div>
      `;
    } else if (tab === 'simple') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-s-p-input">Principal Amount</label>
            <span class="form-hint">${formatCurrency(state.simplePrincipal, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-s-p-input" class="form-input has-prefix" min="100" max="2000000" step="500" value="${state.simplePrincipal}" />
          </div>
          <div class="slider-container">
            <input type="range" id="sd-s-p-slider" class="range-slider" min="1000" max="100000" step="500" value="${Math.min(state.simplePrincipal, 100000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-s-r-input">Annual Interest Rate</label>
            <span class="form-hint">${state.simpleRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-s-r-input" class="form-input has-suffix" min="0.1" max="25" step="0.1" value="${state.simpleRate}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-s-r-slider" class="range-slider" min="1" max="15" step="0.1" value="${state.simpleRate}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-s-t-input">Time Period</label>
            <span class="form-hint">${state.simpleYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-s-t-input" class="form-input has-suffix" min="1" max="30" step="1" value="${state.simpleYears}" />
            <span class="input-suffix">Years</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-s-t-slider" class="range-slider" min="1" max="20" step="1" value="${state.simpleYears}" />
          </div>
        </div>
      `;
    } else if (tab === 'fd') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-fd-p-input">Fixed Deposit Principal</label>
            <span class="form-hint">${formatCurrency(state.fdPrincipal, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-fd-p-input" class="form-input has-prefix" min="500" max="5000000" step="1000" value="${state.fdPrincipal}" />
          </div>
          <div class="slider-container">
            <input type="range" id="sd-fd-p-slider" class="range-slider" min="1000" max="250000" step="1000" value="${Math.min(state.fdPrincipal, 250000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-fd-r-input">Annual FD Interest Rate</label>
            <span class="form-hint">${state.fdRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-fd-r-input" class="form-input has-suffix" min="1" max="15" step="0.05" value="${state.fdRate}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-fd-r-slider" class="range-slider" min="3" max="10" step="0.05" value="${state.fdRate}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-fd-m-input">FD Tenure (Months)</label>
            <span class="form-hint">${state.fdMonths} Months (${(state.fdMonths / 12).toFixed(1)} Yrs)</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-fd-m-input" class="form-input has-suffix" min="1" max="120" step="1" value="${state.fdMonths}" />
            <span class="input-suffix">Months</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-fd-m-slider" class="range-slider" min="6" max="60" step="1" value="${Math.min(state.fdMonths, 60)}" />
          </div>
        </div>
      `;
    } else if (tab === 'rd') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-rd-m-input">Monthly Deposit</label>
            <span class="form-hint">${formatCurrency(state.rdMonthly, undefined, false)} / mo</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-rd-m-input" class="form-input has-prefix" min="50" max="100000" step="50" value="${state.rdMonthly}" />
          </div>
          <div class="slider-container">
            <input type="range" id="sd-rd-m-slider" class="range-slider" min="100" max="10000" step="50" value="${Math.min(state.rdMonthly, 10000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-rd-r-input">Annual RD Interest Rate</label>
            <span class="form-hint">${state.rdRate}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-rd-r-input" class="form-input has-suffix" min="1" max="15" step="0.05" value="${state.rdRate}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-rd-r-slider" class="range-slider" min="3" max="10" step="0.05" value="${state.rdRate}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-rd-t-input">Tenure (Months)</label>
            <span class="form-hint">${state.rdMonths} Months (${(state.rdMonths / 12).toFixed(1)} Yrs)</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-rd-t-input" class="form-input has-suffix" min="6" max="120" step="1" value="${state.rdMonths}" />
            <span class="input-suffix">Months</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-rd-t-slider" class="range-slider" min="6" max="60" step="1" value="${Math.min(state.rdMonths, 60)}" />
          </div>
        </div>
      `;
    } else if (tab === 'ppf') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-ppf-a-input">Annual Contribution (Max 1.5 Lakhs / yr)</label>
            <span class="form-hint">${formatCurrency(state.ppfAnnual, undefined, false)} / yr</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-ppf-a-input" class="form-input has-prefix" min="500" max="150000" step="1000" value="${state.ppfAnnual}" />
          </div>
          <div class="slider-container">
            <input type="range" id="sd-ppf-a-slider" class="range-slider" min="10000" max="150000" step="1000" value="${state.ppfAnnual}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-ppf-r-input">Government Interest Rate</label>
            <span class="form-hint">${state.ppfRate}% (Tax-Free)</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-ppf-r-input" class="form-input has-suffix" min="5" max="10" step="0.1" value="${state.ppfRate}" />
            <span class="input-suffix">%</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-ppf-t-input">Tenure (Standard 15 Years)</label>
            <span class="form-hint">${state.ppfYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-ppf-t-input" class="form-input has-suffix" min="15" max="30" step="5" value="${state.ppfYears}" />
            <span class="input-suffix">Years</span>
          </div>
        </div>
      `;
    } else {
      // Goal
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-g-t-input">Target Goal Corpus</label>
            <span class="form-hint">${formatCurrency(state.goalCorpus, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-g-t-input" class="form-input has-prefix" min="5000" max="10000000" step="5000" value="${state.goalCorpus}" />
          </div>
          <div class="slider-container">
            <input type="range" id="sd-g-t-slider" class="range-slider" min="10000" max="1000000" step="5000" value="${Math.min(state.goalCorpus, 1000000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-g-y-input">Time Horizon</label>
            <span class="form-hint">${state.goalYears} Years</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-g-y-input" class="form-input has-suffix" min="1" max="35" step="1" value="${state.goalYears}" />
            <span class="input-suffix">Years</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-g-y-slider" class="range-slider" min="1" max="25" step="1" value="${state.goalYears}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-g-r-input">Expected Annual Return</label>
            <span class="form-hint">${state.goalReturn}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="sd-g-r-input" class="form-input has-suffix" min="1" max="25" step="0.1" value="${state.goalReturn}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="sd-g-r-slider" class="range-slider" min="3" max="18" step="0.1" value="${state.goalReturn}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="sd-g-i-input">Existing Initial Savings</label>
            <span class="form-hint">${formatCurrency(state.goalInitial, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="sd-g-i-input" class="form-input has-prefix" min="0" max="1000000" step="2500" value="${state.goalInitial}" />
          </div>
        </div>
      `;
    }
  }

  function renderTabMetrics(type, res, curr) {
    if (type === 'goal') {
      return `
        <div class="hero-metric-box">
          <span class="metric-label">Required Monthly Savings</span>
          <span class="metric-value">${formatCurrency(res.monthlySavings)} / mo</span>
          <span class="metric-subtext">To reach ${formatCurrency(res.targetCorpus)} in ${state.goalYears} years</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span class="metric-label">Target Corpus</span>
            <span class="metric-value">${formatCurrency(res.targetCorpus)}</span>
            <span class="metric-subtext">Goal target value</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Total Out-of-Pocket</span>
            <span class="metric-value">${formatCurrency(res.totalDeposits)}</span>
            <span class="metric-subtext">Principal funded</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Compound Gains</span>
            <span class="metric-value">${formatCurrency(res.estimatedReturns)}</span>
            <span class="metric-subtext">Returns generated</span>
          </div>
        </div>
      `;
    }

    const total = res.futureValue || res.maturityAmount || res.totalAmount || 0;
    const princ = res.totalDeposits || res.totalInvested || res.principal || 0;
    const int = res.totalInterest || 0;

    return `
      <div class="hero-metric-box">
        <span class="metric-label">Total Maturity Value</span>
        <span class="metric-value">${formatCurrency(total)}</span>
        <span class="metric-subtext">Principal + accumulated interest yield</span>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="metric-label">Total Deposits</span>
          <span class="metric-value">${formatCurrency(princ)}</span>
          <span class="metric-subtext">Capital invested</span>
        </div>
        <div class="summary-card">
          <span class="metric-label">Total Interest Earned</span>
          <span class="metric-value">${formatCurrency(int)}</span>
          <span class="metric-subtext">Guaranteed/projected yield</span>
        </div>
        ${res.effectiveRate ? `
          <div class="summary-card">
            <span class="metric-label">Effective APY</span>
            <span class="metric-value">${res.effectiveRate}%</span>
            <span class="metric-subtext">Annualized yield</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  function getDonutValues(type, res) {
    if (type === 'goal') {
      return {
        princ: res.totalDeposits,
        int: res.estimatedReturns,
        total: res.targetCorpus
      };
    }
    return {
      princ: res.totalDeposits || res.totalInvested || res.principal || 0,
      int: res.totalInterest || 0,
      total: res.futureValue || res.maturityAmount || res.totalAmount || 1
    };
  }

  function renderScheduleSection(type, res) {
    if (!res.yearlyBreakdown || res.yearlyBreakdown.length === 0) return '';

    return `
      <div class="panel" style="margin-top: 1.5rem;">
        <div class="panel-header">
          <span class="panel-title">Year-by-Year Accumulation Schedule</span>
          <button class="btn btn-secondary btn-sm" id="btn-export-sd-csv">Export CSV</button>
        </div>
        <div id="savings-growth-chart-box"></div>

        <div class="table-wrapper" style="margin-top: 1.25rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Invested Deposits</th>
                <th>Interest Earned</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              ${res.yearlyBreakdown.map((r) => `
                <tr>
                  <td><strong>Year ${r.year}</strong></td>
                  <td>${formatCurrency(r.totalDeposits || r.invested || 0)}</td>
                  <td>${formatCurrency(r.interestEarned || r.totalInterest || 0)}</td>
                  <td><strong>${formatCurrency(r.balance || r.closingBalance || 0)}</strong></td>
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

    const resetBtn = container.querySelector('#btn-reset-savings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }

    const csvBtn = container.querySelector('#btn-export-sd-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const { type, res } = calculateActiveTab();
        const headers = ['Year', 'Cumulative Deposits', 'Interest Yield', 'Balance'];
        const rows = (res.yearlyBreakdown || []).map((r) => [
          `Year ${r.year}`,
          r.totalDeposits || r.invested || 0,
          r.interestEarned || r.totalInterest || 0,
          r.balance || r.closingBalance || 0
        ]);
        exportToCSV(`savings_deposit_schedule_${state.activeTab}`, headers, rows);
      });
    }

    // Dynamic bindings based on active tab
    if (state.activeTab === 'compound') {
      bindInput('sd-c-p-input', 'sd-c-p-slider', (v) => { state.compoundPrincipal = v; });
      bindInput('sd-c-r-input', 'sd-c-r-slider', (v) => { state.compoundRate = v; });
      bindInput('sd-c-t-input', 'sd-c-t-slider', (v) => { state.compoundYears = v; });
      const recInput = container.querySelector('#sd-c-rec-input');
      if (recInput) recInput.addEventListener('input', (e) => { state.compoundRecurring = Math.max(0, Number(e.target.value) || 0); render(); });
      const freqSel = container.querySelector('#sd-c-freq-select');
      if (freqSel) freqSel.addEventListener('change', (e) => { state.compoundFrequency = e.target.value; render(); });
    } else if (state.activeTab === 'simple') {
      bindInput('sd-s-p-input', 'sd-s-p-slider', (v) => { state.simplePrincipal = v; });
      bindInput('sd-s-r-input', 'sd-s-r-slider', (v) => { state.simpleRate = v; });
      bindInput('sd-s-t-input', 'sd-s-t-slider', (v) => { state.simpleYears = v; });
    } else if (state.activeTab === 'fd') {
      bindInput('sd-fd-p-input', 'sd-fd-p-slider', (v) => { state.fdPrincipal = v; });
      bindInput('sd-fd-r-input', 'sd-fd-r-slider', (v) => { state.fdRate = v; });
      bindInput('sd-fd-m-input', 'sd-fd-m-slider', (v) => { state.fdMonths = v; });
    } else if (state.activeTab === 'rd') {
      bindInput('sd-rd-m-input', 'sd-rd-m-slider', (v) => { state.rdMonthly = v; });
      bindInput('sd-rd-r-input', 'sd-rd-r-slider', (v) => { state.rdRate = v; });
      bindInput('sd-rd-t-input', 'sd-rd-t-slider', (v) => { state.rdMonths = v; });
    } else if (state.activeTab === 'ppf') {
      bindInput('sd-ppf-a-input', 'sd-ppf-a-slider', (v) => { state.ppfAnnual = v; });
      const rInput = container.querySelector('#sd-ppf-r-input');
      if (rInput) rInput.addEventListener('input', (e) => { state.ppfRate = Math.max(0, Number(e.target.value) || 0); render(); });
      const tInput = container.querySelector('#sd-ppf-t-input');
      if (tInput) tInput.addEventListener('input', (e) => { state.ppfYears = Math.max(15, Number(e.target.value) || 15); render(); });
    } else {
      bindInput('sd-g-t-input', 'sd-g-t-slider', (v) => { state.goalCorpus = v; });
      bindInput('sd-g-y-input', 'sd-g-y-slider', (v) => { state.goalYears = v; });
      bindInput('sd-g-r-input', 'sd-g-r-slider', (v) => { state.goalReturn = v; });
      const initInput = container.querySelector('#sd-g-i-input');
      if (initInput) initInput.addEventListener('input', (e) => { state.goalInitial = Math.max(0, Number(e.target.value) || 0); render(); });
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
