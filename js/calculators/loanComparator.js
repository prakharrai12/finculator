/**
 * Finculator 3-Way Loan Comparator (v2)
 * Compares 3 distinct loan scenarios side-by-side with dynamic "Best Value" badge
 */

import { calculateEMI } from '../math/financeMath.js';
import { formatCurrency, formatPercent, getGlobalCurrency } from '../utils/formatters.js';
import { getStoredState, setStoredState } from '../utils/storage.js';

export function initLoanComparator(container) {
  if (!container) return;

  const defaultState = {
    loan1: { name: 'Offer 1', principal: 0, rate: 0, tenureYears: 0, fee: 0 },
    loan2: { name: 'Offer 2', principal: 0, rate: 0, tenureYears: 0, fee: 0 },
    loan3: { name: 'Offer 3', principal: 0, rate: 0, tenureYears: 0, fee: 0 }
  };

  const state = getStoredState('loan_comparator', defaultState);

  function calculateAll() {
    const r1 = calculateEMI(state.loan1.principal, state.loan1.rate, state.loan1.tenureYears * 12, state.loan1.fee);
    const r2 = calculateEMI(state.loan2.principal, state.loan2.rate, state.loan2.tenureYears * 12, state.loan2.fee);
    const r3 = calculateEMI(state.loan3.principal, state.loan3.rate, state.loan3.tenureYears * 12, state.loan3.fee);

    // Identify lowest net total cost
    const costs = [
      { id: 1, cost: r1.netTotalCost },
      { id: 2, cost: r2.netTotalCost },
      { id: 3, cost: r3.netTotalCost }
    ];
    costs.sort((a, b) => a.cost - b.cost);
    const bestId = costs[0].id;

    setStoredState('loan_comparator', state);
    return { r1, r2, r3, bestId };
  }

  function render() {
    const { r1, r2, r3, bestId } = calculateAll();
    const curr = getGlobalCurrency();

    container.innerHTML = `
      <div class="calculator-view">
        <div class="calculator-header">
          <div class="calculator-title-group">
            <h1 class="calculator-title">Multi-Scenario Loan Comparator</h1>
            <p class="calculator-desc">Evaluate up to 3 competitive mortgage or loan offers side-by-side. Finculator automatically calculates the Lowest Total Cost and Best Value proposition accounting for fees and interest rates.</p>
          </div>
          <div class="calculator-actions">
            <button class="btn btn-secondary btn-sm" id="btn-reset-comp">Reset Defaults</button>
          </div>
        </div>

        <div class="comparator-grid">
          <!-- Loan 1 -->
          ${renderLoanCard(1, state.loan1, r1, bestId === 1, curr)}

          <!-- Loan 2 -->
          ${renderLoanCard(2, state.loan2, r2, bestId === 2, curr)}

          <!-- Loan 3 -->
          ${renderLoanCard(3, state.loan3, r3, bestId === 3, curr)}
        </div>
      </div>
    `;

    attachEvents();
  }

  function renderLoanCard(id, loan, result, isBest, curr) {
    return `
      <div class="comparator-column ${isBest ? 'best-value' : ''}" id="loan-card-${id}">
        <div class="comparator-card-header">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="card-tag">Scenario ${id}</span>
            <span id="loan-${id}-badge-slot">${isBest ? '<span class="badge badge-best">Best Value (Lowest Total Cost)</span>' : ''}</span>
          </div>
          <input type="text" id="loan-${id}-name" class="form-input" value="${loan.name}" style="font-weight: 600; margin-top: 0.4rem; font-family: var(--font-sans);" />
        </div>

        <!-- Result Box -->
        <div class="hero-metric-box" style="padding: 1.15rem; margin-bottom: 1.25rem;">
          <span class="metric-label">Monthly EMI</span>
          <span class="metric-value" id="loan-${id}-emi-val" style="font-size: 1.75rem;">${formatCurrency(result.monthlyEMI)}</span>
          <span class="metric-subtext" id="loan-${id}-net-sub">Total Cost: ${formatCurrency(result.netTotalCost)}</span>
        </div>

        <!-- Inputs -->
        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="loan-${id}-p">Principal</label>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="loan-${id}-p" class="form-input has-prefix" placeholder="0" value="${loan.principal ? loan.principal : ''}" step="50000" />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="loan-${id}-r">Interest Rate</label>
          </div>
          <div class="input-wrapper">
            <input type="number" id="loan-${id}-r" class="form-input has-suffix" placeholder="0" value="${loan.rate ? loan.rate : ''}" step="0.05" />
            <span class="input-suffix">%</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="loan-${id}-t">Tenure (Years)</label>
          </div>
          <div class="input-wrapper">
            <input type="number" id="loan-${id}-t" class="form-input has-suffix" placeholder="0" value="${loan.tenureYears ? loan.tenureYears : ''}" step="1" />
            <span class="input-suffix">Yrs</span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="loan-${id}-f">Processing / Closing Fees</label>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix">${curr.symbol}</span>
            <input type="number" id="loan-${id}-f" class="form-input has-prefix" placeholder="0" value="${loan.fee ? loan.fee : ''}" step="500" />
          </div>
        </div>

        <!-- Summary Metrics -->
        <div class="breakdown-section" style="margin-top: 1rem;">
          <div class="breakdown-row">
            <span>Total Interest</span>
            <span class="breakdown-val" id="loan-${id}-int-val">${formatCurrency(result.totalInterest)}</span>
          </div>
          <div class="breakdown-row">
            <span>Total Payment</span>
            <span class="breakdown-val" id="loan-${id}-pay-val">${formatCurrency(result.totalPayment)}</span>
          </div>
          <div class="breakdown-row">
            <span>Net Lifetime Cost</span>
            <span class="breakdown-val"><strong id="loan-${id}-cost-val">${formatCurrency(result.netTotalCost)}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  function updateOutputs() {
    const { r1, r2, r3, bestId } = calculateAll();
    const results = { 1: r1, 2: r2, 3: r3 };

    [1, 2, 3].forEach((id) => {
      const res = results[id];
      const card = container.querySelector(`#loan-card-${id}`);
      const isBest = bestId === id;

      if (card) {
        if (isBest) card.classList.add('best-value');
        else card.classList.remove('best-value');
      }

      const badgeSlot = container.querySelector(`#loan-${id}-badge-slot`);
      if (badgeSlot) {
        badgeSlot.innerHTML = isBest ? '<span class="badge badge-best">Best Value (Lowest Total Cost)</span>' : '';
      }

      const emiVal = container.querySelector(`#loan-${id}-emi-val`);
      if (emiVal) emiVal.textContent = formatCurrency(res.monthlyEMI);

      const netSub = container.querySelector(`#loan-${id}-net-sub`);
      if (netSub) netSub.textContent = `Total Cost: ${formatCurrency(res.netTotalCost)}`;

      const intVal = container.querySelector(`#loan-${id}-int-val`);
      if (intVal) intVal.textContent = formatCurrency(res.totalInterest);

      const payVal = container.querySelector(`#loan-${id}-pay-val`);
      if (payVal) payVal.textContent = formatCurrency(res.totalPayment);

      const costVal = container.querySelector(`#loan-${id}-cost-val`);
      if (costVal) costVal.textContent = formatCurrency(res.netTotalCost);
    });
  }

  function attachEvents() {
    container.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('focus', () => input.select());
    });

    [1, 2, 3].forEach((id) => {
      const loanKey = `loan${id}`;
      bindText(`loan-${id}-name`, (v) => { state[loanKey].name = v; });
      bindNum(`loan-${id}-p`, (v) => { state[loanKey].principal = v; });
      bindNum(`loan-${id}-r`, (v) => { state[loanKey].rate = v; });
      bindNum(`loan-${id}-t`, (v) => { state[loanKey].tenureYears = v; });
      bindNum(`loan-${id}-f`, (v) => { state[loanKey].fee = v; });
    });

    const resetBtn = container.querySelector('#btn-reset-comp');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        [1, 2, 3].forEach((id) => {
          const key = `loan${id}`;
          state[key].principal = 0;
          state[key].rate = 0;
          state[key].tenureYears = 0;
          state[key].fee = 0;
        });
        setStoredState('loan_comparator', state);
        render();
      });
    }
  }

  function bindText(id, setter) {
    const input = container.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('input', (e) => {
        setter(e.target.value);
        setStoredState('loan_comparator', state);
      });
    }
  }

  function bindNum(id, setter) {
    const input = container.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('input', (e) => {
        const raw = e.target.value;
        const val = raw === '' ? 0 : Math.max(0, Number(raw));
        setter(val);
        updateOutputs();
      });
    }
  }

  render();
}
