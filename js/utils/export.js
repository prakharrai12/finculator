/**
 * Finculator Data Export Engine (CSV & PDF/Print)
 */

/**
 * Generate and download a standard CSV file
 * @param {string} filename 
 * @param {Array<string>} headers 
 * @param {Array<Array<any>>} rows 
 */
export function exportToCSV(filename, headers, rows) {
  if (!headers || !rows || rows.length === 0) {
    showToast('No data available to export');
    return;
  }

  // Prepend UTF-8 BOM for Excel compatibility
  let csvContent = '\uFEFF';

  // Add Headers
  csvContent += headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n';

  // Add Rows
  rows.forEach((row) => {
    const rowStr = row
      .map((val) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
    csvContent += rowStr + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${filename}.csv`);
}

/**
 * Trigger browser print dialog for institutional report
 */
export function triggerPrint() {
  window.print();
}

/**
 * Global toast notification trigger
 * @param {string} message 
 */
export function showToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  if (window._toastTimeout) {
    clearTimeout(window._toastTimeout);
  }

  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}
