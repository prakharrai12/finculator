/**
 * Finculator Tax & Business Suite
 * Sub-tabs: Income Tax, GST, Take-Home Salary, Profit Margin, Break-Even Analysis
 * Calibrated for professional salary baseline (e.g. ₹200k/month = ₹24 Lakhs/year)
 */

import {
  calculateIncomeTax,
  calculateGST,
  calculateTakeHomeSalary,
  calculateProfitMargin,
  calculateBreakEven
} from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';
import { renderDonutChart } from '../components/charts.js';

export function initTaxBusinessSuite(container) {
  if (!container) return;

  const defaultState = {
    activeTab: 'tax', // 'tax' | 'gst' | 'salary' | 'margin' | 'breakeven'
    // Tax (Default ₹200k/month = ₹24,00,000 / year)
    taxGross: 2400000,
    taxDeductions: 150000,
    taxRegime: 'new',
    // GST
    gstAmount: 25000,
    gstRate: 18,
    gstMode: 'add',
    // Salary (Default ₹200k/month = ₹24,00,000 / year CTC)
    salaryCTC: 2400000,
    salaryBasicPct: 40,
    salaryHraPct: 20,
    // Margin
    marginCost: 65,
    marginPrice: 100,
    marginUnits: 500,
    // Break-even
    beFixedCosts: 50000,
    beVariableCost: 25,
    bePrice: 75
  };

  const state = getStoredState('tax_business', defaultState);

  function calculateActiveTab() {
    setStoredState('tax_business', state);
    const tab = state.activeTab;

    if (tab === 'tax') {
      return {
        type: 'tax',
        res: calculateIncomeTax(state.taxGross, state.taxDeductions, state.taxRegime)
      };
    } else if (tab === 'gst') {
      return {
        type: 'gst',
        res: calculateGST(state.gstAmount, state.gstRate, state.gstMode)
      };
    } else if (tab === 'salary') {
      return {
        type: 'salary',
        res: calculateTakeHomeSalary(state.salaryCTC, state.salaryBasicPct, state.salaryHraPct)
      };
    } else if (tab === 'margin') {
      return {
        type: 'margin',
        res: calculateProfitMargin(state.marginCost, state.marginPrice, state.marginUnits)
      };
    } else {
      return {
        type: 'breakeven',
        res: calculateBreakEven(state.beFixedCosts, state.beVariableCost, state.bePrice)
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
            <h1 class="calculator-title">Tax & Business Suite</h1>
            <p class="calculator-desc">Analyze direct income taxes, GST compliance, net in-hand take-home salaries (calibrated for ₹200k/month baseline), and business unit margins.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-tb">Reset Defaults</button>
          </div>
        </div>

        <!-- Distinctly Bordered Sub-Tabs Bar -->
        <div class="tab-bar" id="tb-tab-bar">
          <button class="tab-btn ${state.activeTab === 'tax' ? 'active' : ''}" data-tab="tax">Income Tax (Old vs New)</button>
          <button class="tab-btn ${state.activeTab === 'salary' ? 'active' : ''}" data-tab="salary">Take-Home Salary (₹200k / mo)</button>
          <button class="tab-btn ${state.activeTab === 'gst' ? 'active' : ''}" data-tab="gst">GST Calculator</button>
          <button class="tab-btn ${state.activeTab === 'margin' ? 'active' : ''}" data-tab="margin">Profit Margin & Markup</button>
          <button class="tab-btn ${state.activeTab === 'breakeven' ? 'active' : ''}" data-tab="breakeven">Break-Even Analysis</button>
        </div>

        <div class="calc-grid">
          <!-- Section 1: Inputs Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                ${getTabTitle(state.activeTab)} Parameters
              </span>
              <span class="panel-subtitle">INPUT CONTROLS</span>
            </div>
            ${renderTabInputs(state.activeTab, curr)}
          </div>

          <!-- Section 2: Output Results Panel -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Calculated Outlay Summary
              </span>
              <span class="panel-subtitle">FINANCIAL METRICS</span>
            </div>

            ${renderTabMetrics(type, res, curr)}

            <!-- Donut Chart & Breakdown -->
            <div id="tb-donut-box"></div>
          </div>
        </div>
      </div>
    `;

    // Render Donut Chart
    const donutBox = container.querySelector('#tb-donut-box');
    if (donutBox) {
      renderDonut(type, res, donutBox);
    }

    attachEvents();
  }

  function getTabTitle(tab) {
    switch (tab) {
      case 'tax': return 'Income Tax';
      case 'gst': return 'GST';
      case 'salary': return 'Take-Home Salary';
      case 'margin': return 'Profit Margin';
      case 'breakeven': return 'Break-Even';
      default: return 'Tax & Business';
    }
  }

  function renderTabInputs(tab, curr) {
    if (tab === 'tax') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-tax-g-input">Gross Annual Taxable Income</label>
            <span class="form-hint">${formatCurrency(state.taxGross, undefined, false)} / yr</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-tax-g-input" class="form-input has-prefix" min="100000" max="50000000" step="50000" value="${state.taxGross}" />
          </div>
          <div class="slider-container">
            <input type="range" id="tb-tax-g-slider" class="range-slider" min="300000" max="10000000" step="50000" value="${Math.min(state.taxGross, 10000000)}" />
          </div>
          <div class="slider-limits">
            <span>₹3 Lakh</span>
            <span>₹1 Crore</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-tax-d-input">Deductions (80C, 80D, HRA for Old Regime)</label>
            <span class="form-hint">${formatCurrency(state.taxDeductions, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-tax-d-input" class="form-input has-prefix" min="0" max="2000000" step="10000" value="${state.taxDeductions}" />
          </div>
          <div class="slider-container">
            <input type="range" id="tb-tax-d-slider" class="range-slider" min="0" max="500000" step="10000" value="${Math.min(state.taxDeductions, 500000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label">Tax Regime Comparison Mode</label>
          </div>
          <div class="toggle-group" id="tb-tax-regime-toggle">
            <button class="toggle-option ${state.taxRegime === 'new' ? 'active' : ''}" data-regime="new">New Tax Regime</button>
            <button class="toggle-option ${state.taxRegime === 'old' ? 'active' : ''}" data-regime="old">Old Tax Regime</button>
          </div>
        </div>
      `;
    } else if (tab === 'salary') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-sal-ctc-input">Annual CTC (Cost to Company)</label>
            <span class="form-hint">${formatCurrency(state.salaryCTC, undefined, false)} (${formatCurrency(state.salaryCTC / 12, undefined, false)} / mo)</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-sal-ctc-input" class="form-input has-prefix" min="100000" max="50000000" step="50000" value="${state.salaryCTC}" />
          </div>
          <div class="slider-container">
            <input type="range" id="tb-sal-ctc-slider" class="range-slider" min="300000" max="10000000" step="50000" value="${Math.min(state.salaryCTC, 10000000)}" />
          </div>
          <div class="slider-limits">
            <span>₹3 Lakh</span>
            <span>₹24 Lakh (₹200k/mo)</span>
            <span>₹1 Crore</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-sal-b-input">Basic Salary Percentage of CTC</label>
            <span class="form-hint">${state.salaryBasicPct}%</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="tb-sal-b-input" class="form-input has-suffix" min="20" max="60" step="5" value="${state.salaryBasicPct}" />
            <span class="input-suffix">%</span>
          </div>
          <div class="slider-container">
            <input type="range" id="tb-sal-b-slider" class="range-slider" min="30" max="50" step="5" value="${state.salaryBasicPct}" />
          </div>
        </div>
      `;
    } else if (tab === 'gst') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-gst-a-input">Invoice Base Amount</label>
            <span class="form-hint">${formatCurrency(state.gstAmount, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-gst-a-input" class="form-input has-prefix" min="10" max="10000000" step="100" value="${state.gstAmount}" />
          </div>
          <div class="slider-container">
            <input type="range" id="tb-gst-a-slider" class="range-slider" min="500" max="500000" step="1000" value="${Math.min(state.gstAmount, 500000)}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-gst-r-select">GST Rate Slab</label>
          </div>
          <select id="tb-gst-r-select" class="form-input">
            <option value="5" ${state.gstRate === 5 ? 'selected' : ''}>5% (Essential Goods)</option>
            <option value="12" ${state.gstRate === 12 ? 'selected' : ''}>12% (Standard Concessional)</option>
            <option value="18" ${state.gstRate === 18 ? 'selected' : ''}>18% (Standard Services & Goods)</option>
            <option value="28" ${state.gstRate === 28 ? 'selected' : ''}>28% (Luxury & De-merit)</option>
            <option value="0.25" ${state.gstRate === 0.25 ? 'selected' : ''}>0.25% (Precious Stones)</option>
            <option value="3" ${state.gstRate === 3 ? 'selected' : ''}>3% (Gold & Silver)</option>
          </select>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label">Calculation Mode</label>
          </div>
          <div class="toggle-group" id="tb-gst-mode-toggle">
            <button class="toggle-option ${state.gstMode === 'add' ? 'active' : ''}" data-mode="add">Add GST (Exclusive)</button>
            <button class="toggle-option ${state.gstMode === 'remove' ? 'active' : ''}" data-mode="remove">Remove GST (Inclusive)</button>
          </div>
        </div>
      `;
    } else if (tab === 'margin') {
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-m-c-input">Cost Price Per Unit (CP)</label>
            <span class="form-hint">${formatCurrency(state.marginCost, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-m-c-input" class="form-input has-prefix" min="1" max="1000000" step="5" value="${state.marginCost}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-m-p-input">Selling Price Per Unit (SP)</label>
            <span class="form-hint">${formatCurrency(state.marginPrice, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-m-p-input" class="form-input has-prefix" min="1" max="1000000" step="5" value="${state.marginPrice}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-m-u-input">Units Sold</label>
            <span class="form-hint">${state.marginUnits} Units</span>
          </div>
          <div class="input-wrapper">
            <input type="number" id="tb-m-u-input" class="form-input" min="1" max="1000000" step="10" value="${state.marginUnits}" />
          </div>
        </div>
      `;
    } else {
      // Break-even
      return `
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-be-fc-input">Total Fixed Costs (Rent, Salaries, Overhead)</label>
            <span class="form-hint">${formatCurrency(state.beFixedCosts, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-be-fc-input" class="form-input has-prefix" min="100" max="10000000" step="1000" value="${state.beFixedCosts}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-be-vc-input">Variable Cost Per Unit (Materials, Labor)</label>
            <span class="form-hint">${formatCurrency(state.beVariableCost, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-be-vc-input" class="form-input has-prefix" min="0" max="100000" step="5" value="${state.beVariableCost}" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="tb-be-p-input">Selling Price Per Unit</label>
            <span class="form-hint">${formatCurrency(state.bePrice, undefined, false)}</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="tb-be-p-input" class="form-input has-prefix" min="1" max="100000" step="5" value="${state.bePrice}" />
          </div>
        </div>
      `;
    }
  }

  function renderTabMetrics(type, res, curr) {
    if (type === 'tax') {
      return `
        <div class="hero-metric-box">
          <span class="metric-label">Total Tax Liability (${state.taxRegime === 'new' ? 'New Regime' : 'Old Regime'})</span>
          <span class="metric-value">${formatCurrency(res.selectedTax)}</span>
          <span class="metric-subtext">Effective tax rate: ${res.effectiveRate}% on ${formatCurrency(state.taxGross)}</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card highlight">
            <span class="metric-label">Net Take-Home Pay</span>
            <span class="metric-value">${formatCurrency(res.netTakeHome)}</span>
            <span class="metric-subtext">Annual disposable pay</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">New Regime Tax</span>
            <span class="metric-value">${formatCurrency(res.newRegime.totalTax)}</span>
            <span class="metric-subtext">${res.newRegime.effectiveRate}% rate</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Old Regime Tax</span>
            <span class="metric-value">${formatCurrency(res.oldRegime.totalTax)}</span>
            <span class="metric-subtext">${res.oldRegime.effectiveRate}% rate</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Recommended Regime</span>
            <span class="metric-value" style="font-size: 1.15rem; color: var(--brand-cyan);">${res.recommendedRegime}</span>
            <span class="metric-subtext">Saves ${formatCurrency(res.savingsWithRecommended)}</span>
          </div>
        </div>
      `;
    }

    if (type === 'salary') {
      return `
        <div class="hero-metric-box">
          <span class="metric-label">Monthly Net In-Hand Salary</span>
          <span class="metric-value">${formatCurrency(res.netMonthlySalary)} / mo</span>
          <span class="metric-subtext">Annual Net Take-Home: ${formatCurrency(res.netAnnualSalary)} (from ${formatCurrency(res.annualCTC)} CTC)</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span class="metric-label">Monthly Gross</span>
            <span class="metric-value">${formatCurrency(res.monthlyGross)}</span>
            <span class="metric-subtext">CTC / 12 months</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Monthly Income Tax</span>
            <span class="metric-value">${formatCurrency(res.taxMonthly)}</span>
            <span class="metric-subtext">TDS withholding / mo</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Monthly PF</span>
            <span class="metric-value">${formatCurrency(res.employeePFMonthly)}</span>
            <span class="metric-subtext">Employee provident fund</span>
          </div>
        </div>
      `;
    }

    if (type === 'gst') {
      return `
        <div class="hero-metric-box">
          <span class="metric-label">Total Gross Invoice Amount</span>
          <span class="metric-value">${formatCurrency(res.totalAmount)}</span>
          <span class="metric-subtext">Net Amount (${formatCurrency(res.netAmount)}) + GST (${formatCurrency(res.gstAmount)})</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span class="metric-label">Total GST (${state.gstRate}%)</span>
            <span class="metric-value">${formatCurrency(res.gstAmount)}</span>
            <span class="metric-subtext">Total tax levy</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">CGST (Central)</span>
            <span class="metric-value">${formatCurrency(res.cgst)}</span>
            <span class="metric-subtext">${(state.gstRate / 2)}%</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">SGST (State)</span>
            <span class="metric-value">${formatCurrency(res.sgst)}</span>
            <span class="metric-subtext">${(state.gstRate / 2)}%</span>
          </div>
        </div>
      `;
    }

    if (type === 'margin') {
      return `
        <div class="hero-metric-box">
          <span class="metric-label">Gross Profit Margin</span>
          <span class="metric-value">${res.grossMarginPct}%</span>
          <span class="metric-subtext">Markup: ${res.markupPct}% | Total Profit: ${formatCurrency(res.totalProfit)}</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span class="metric-label">Total Revenue</span>
            <span class="metric-value">${formatCurrency(res.totalRevenue)}</span>
            <span class="metric-subtext">SP × Units</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Total Cost</span>
            <span class="metric-value">${formatCurrency(res.totalCost)}</span>
            <span class="metric-subtext">CP × Units</span>
          </div>
          <div class="summary-card">
            <span class="metric-label">Profit Per Unit</span>
            <span class="metric-value">${formatCurrency(res.profitPerUnit)}</span>
            <span class="metric-subtext">SP − CP</span>
          </div>
        </div>
      `;
    }

    // Break-even
    return `
      <div class="hero-metric-box">
        <span class="metric-label">Break-Even Sales Threshold</span>
        <span class="metric-value">${res.breakEvenUnits.toLocaleString()} Units</span>
        <span class="metric-subtext">Minimum sales revenue required: ${formatCurrency(res.breakEvenRevenue)}</span>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="metric-label">Unit Margin</span>
          <span class="metric-value">${formatCurrency(res.contributionMargin)}</span>
          <span class="metric-subtext">Price − Variable Cost</span>
        </div>
        <div class="summary-card">
          <span class="metric-label">Margin Ratio</span>
          <span class="metric-value">${res.cmRatio}%</span>
          <span class="metric-subtext">Contribution ratio</span>
        </div>
        <div class="summary-card">
          <span class="metric-label">Fixed Costs</span>
          <span class="metric-value">${formatCurrency(res.fixedCosts)}</span>
          <span class="metric-subtext">Overhead to recover</span>
        </div>
      </div>
    `;
  }

  function renderDonut(type, res, donutBox) {
    if (type === 'tax') {
      const takeHome = res.netTakeHome;
      const tax = res.selectedTax;
      const tot = takeHome + tax || 1;
      const thPct = Math.round((takeHome / tot) * 100);
      const txPct = 100 - thPct;
      renderDonutChart(donutBox, {
        segments: [
          { label: 'Net Take-Home', value: takeHome, percent: thPct, colorClass: 'principal' },
          { label: 'Income Tax', value: tax, percent: txPct, colorClass: 'interest' }
        ],
        centerLabel: 'Take-Home',
        centerValue: `${thPct}%`
      });
    } else if (type === 'gst') {
      const net = res.netAmount;
      const gst = res.gstAmount;
      const tot = res.totalAmount || 1;
      const netPct = Math.round((net / tot) * 100);
      const gstPct = 100 - netPct;
      renderDonutChart(donutBox, {
        segments: [
          { label: 'Base Value', value: net, percent: netPct, colorClass: 'principal' },
          { label: 'GST Tax', value: gst, percent: gstPct, colorClass: 'interest' }
        ],
        centerLabel: 'Base Ratio',
        centerValue: `${netPct}%`
      });
    } else if (type === 'margin') {
      const cost = res.totalCost;
      const profit = Math.max(0, res.totalProfit);
      const tot = res.totalRevenue || 1;
      const profitPct = res.grossMarginPct;
      const costPct = 100 - profitPct;
      renderDonutChart(donutBox, {
        segments: [
          { label: 'Gross Profit', value: profit, percent: profitPct, colorClass: 'principal' },
          { label: 'Cost of Goods', value: cost, percent: costPct, colorClass: 'interest' }
        ],
        centerLabel: 'Margin',
        centerValue: `${profitPct}%`
      });
    } else if (type === 'salary') {
      const net = res.netAnnualSalary;
      const ded = res.annualCTC - net;
      const tot = res.annualCTC || 1;
      const netPct = Math.round((net / tot) * 100);
      const dedPct = 100 - netPct;
      renderDonutChart(donutBox, {
        segments: [
          { label: 'In-Hand Pay', value: net, percent: netPct, colorClass: 'principal' },
          { label: 'Taxes & PF', value: ded, percent: dedPct, colorClass: 'interest' }
        ],
        centerLabel: 'In-Hand',
        centerValue: `${netPct}%`
      });
    }
  }

  function attachEvents() {
    const tabBtns = container.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-tab');
        render();
      });
    });

    const resetBtn = container.querySelector('#btn-reset-tb');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.assign(state, defaultState);
        render();
      });
    }

    if (state.activeTab === 'tax') {
      bindInput('tb-tax-g-input', 'tb-tax-g-slider', (v) => { state.taxGross = v; });
      bindInput('tb-tax-d-input', 'tb-tax-d-slider', (v) => { state.taxDeductions = v; });
      const regToggle = container.querySelector('#tb-tax-regime-toggle');
      if (regToggle) {
        regToggle.querySelectorAll('.toggle-option').forEach((b) => {
          b.addEventListener('click', () => {
            state.taxRegime = b.getAttribute('data-regime');
            render();
          });
        });
      }
    } else if (state.activeTab === 'gst') {
      bindInput('tb-gst-a-input', 'tb-gst-a-slider', (v) => { state.gstAmount = v; });
      const rSel = container.querySelector('#tb-gst-r-select');
      if (rSel) rSel.addEventListener('change', (e) => { state.gstRate = Number(e.target.value); render(); });
      const mToggle = container.querySelector('#tb-gst-mode-toggle');
      if (mToggle) {
        mToggle.querySelectorAll('.toggle-option').forEach((b) => {
          b.addEventListener('click', () => {
            state.gstMode = b.getAttribute('data-mode');
            render();
          });
        });
      }
    } else if (state.activeTab === 'salary') {
      bindInput('tb-sal-ctc-input', 'tb-sal-ctc-slider', (v) => { state.salaryCTC = v; });
      bindInput('tb-sal-b-input', 'tb-sal-b-slider', (v) => { state.salaryBasicPct = v; });
    } else if (state.activeTab === 'margin') {
      const cInp = container.querySelector('#tb-m-c-input');
      if (cInp) cInp.addEventListener('input', (e) => { state.marginCost = Math.max(0, Number(e.target.value) || 0); render(); });
      const pInp = container.querySelector('#tb-m-p-input');
      if (pInp) pInp.addEventListener('input', (e) => { state.marginPrice = Math.max(0, Number(e.target.value) || 0); render(); });
      const uInp = container.querySelector('#tb-m-u-input');
      if (uInp) uInp.addEventListener('input', (e) => { state.marginUnits = Math.max(1, Number(e.target.value) || 1); render(); });
    } else {
      const fcInp = container.querySelector('#tb-be-fc-input');
      if (fcInp) fcInp.addEventListener('input', (e) => { state.beFixedCosts = Math.max(0, Number(e.target.value) || 0); render(); });
      const vcInp = container.querySelector('#tb-be-vc-input');
      if (vcInp) vcInp.addEventListener('input', (e) => { state.beVariableCost = Math.max(0, Number(e.target.value) || 0); render(); });
      const pInp = container.querySelector('#tb-be-p-input');
      if (pInp) pInp.addEventListener('input', (e) => { state.bePrice = Math.max(0.01, Number(e.target.value) || 0.01); render(); });
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
