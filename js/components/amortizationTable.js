/**
 * Finculator Amortization Table Component
 * Features: Yearly/Monthly toggle, Sticky Header, Pagination, Search, CSV Export
 */

import { formatCurrency } from '../utils/formatters.js';
import { exportToCSV } from '../utils/export.js';

export function createAmortizationTable(container, scheduleResult, options = {}) {
  if (!container) return;

  const { title = 'Amortization Schedule', filename = 'amortization_schedule' } = options;
  let isMonthly = false;
  let currentPage = 1;
  let pageSize = 12;
  let searchTerm = '';

  function render() {
    const rawData = isMonthly ? scheduleResult.monthlySchedule : scheduleResult.yearlySchedule;
    
    // Filter
    const filtered = (rawData || []).filter((row) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const periodStr = isMonthly ? `month ${row.month} year ${row.year}` : `year ${row.year}`;
      return periodStr.toLowerCase().includes(term);
    });

    // Paginate
    const totalItems = filtered.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
    const endIdx = pageSize === 'all' ? totalItems : Math.min(startIdx + pageSize, totalItems);
    const pageRows = filtered.slice(startIdx, endIdx);

    const periodHeader = isMonthly ? 'Month' : 'Year';

    const tableRowsHtml = pageRows.map((r) => {
      const periodLabel = isMonthly ? `Mo ${r.month} (Yr ${r.year})` : `Year ${r.year}`;
      const extraVal = r.extraPayment || r.extraPaid || 0;
      const emiVal = r.emi || r.totalPaid || 0;

      return `
        <tr>
          <td><strong>${periodLabel}</strong></td>
          <td>${formatCurrency(r.openingBalance)}</td>
          <td>${formatCurrency(r.principalPaid)}</td>
          <td>${formatCurrency(r.interestPaid)}</td>
          ${extraVal > 0 ? `<td>${formatCurrency(extraVal)}</td>` : ''}
          <td>${formatCurrency(r.totalPaid || emiVal)}</td>
          <td><strong>${formatCurrency(r.closingBalance)}</strong></td>
        </tr>
      `;
    }).join('');

    const hasExtra = (rawData || []).some((r) => (r.extraPayment || r.extraPaid || 0) > 0);

    container.innerHTML = `
      <div class="table-section">
        <div class="table-toolbar">
          <div class="table-title-group">
            <span class="table-title">${title}</span>
            <div class="toggle-group" id="table-view-toggle">
              <button class="toggle-option ${!isMonthly ? 'active' : ''}" data-view="yearly">Yearly</button>
              <button class="toggle-option ${isMonthly ? 'active' : ''}" data-view="monthly">Monthly</button>
            </div>
          </div>
          <div class="table-controls">
            <input
              type="text"
              class="table-search"
              placeholder="Filter..."
              value="${searchTerm}"
              id="table-search-input"
            />
            <button class="btn btn-secondary btn-sm" id="btn-export-csv">
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>${periodHeader}</th>
                <th>Opening Balance</th>
                <th>Principal</th>
                <th>Interest</th>
                ${hasExtra ? '<th>Extra Paid</th>' : ''}
                <th>Total Paid</th>
                <th>Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml.length > 0 ? tableRowsHtml : `<tr><td colspan="${hasExtra ? 7 : 6}" style="text-align:center; padding: 2rem; color: var(--text-muted);">No records found matching filter</td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="table-pagination">
          <span>Showing ${totalItems > 0 ? startIdx + 1 : 0} - ${endIdx} of ${totalItems} entries</span>
          <div class="pagination-controls">
            <button class="btn btn-secondary btn-sm" id="btn-prev-page" ${currentPage <= 1 ? 'disabled' : ''}>Prev</button>
            <span class="tabular-numbers">Page ${currentPage} / ${totalPages}</span>
            <button class="btn btn-secondary btn-sm" id="btn-next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    const viewToggle = container.querySelector('#table-view-toggle');
    viewToggle.querySelectorAll('.toggle-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        isMonthly = btn.getAttribute('data-view') === 'monthly';
        currentPage = 1;
        render();
      });
    });

    const searchInput = container.querySelector('#table-search-input');
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      currentPage = 1;
      render();
    });

    const prevBtn = container.querySelector('#btn-prev-page');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          render();
        }
      });
    }

    const nextBtn = container.querySelector('#btn-next-page');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          render();
        }
      });
    }

    const exportBtn = container.querySelector('#btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const raw = isMonthly ? scheduleResult.monthlySchedule : scheduleResult.yearlySchedule;
        const headers = [
          isMonthly ? 'Month' : 'Year',
          'Opening Balance',
          'Principal Paid',
          'Interest Paid',
          'Extra Payment',
          'Total Payment',
          'Ending Balance'
        ];
        const rows = raw.map((r) => [
          isMonthly ? `Mo ${r.month} (Yr ${r.year})` : `Year ${r.year}`,
          r.openingBalance,
          r.principalPaid,
          r.interestPaid,
          r.extraPayment || r.extraPaid || 0,
          r.totalPaid || r.emi || 0,
          r.closingBalance
        ]);
        exportToCSV(filename, headers, rows);
      });
    }
  }

  render();
}
