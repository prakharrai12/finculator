/**
 * Finculator Interactive SVG Chart Engine
 * Minimalist monochrome visuals, responsive viewBox, hover interactions
 */

import { formatCurrency, formatPercent } from '../utils/formatters.js';

/**
 * Render Interactive Donut Chart
 * @param {HTMLElement} container 
 * @param {{
 *   segments: Array<{ label: string, value: number, percent: number, colorClass: string }>,
 *   centerLabel: string,
 *   centerValue: string
 * }} options 
 */
export function renderDonutChart(container, options) {
  if (!container) return;
  const { segments, centerLabel, centerValue } = options;

  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segmentElements = segments.map((seg) => {
    const strokeDash = (seg.percent / 100) * circumference;
    const strokeGap = circumference - strokeDash;
    const offset = currentOffset;
    currentOffset += strokeDash;

    return `
      <circle
        class="donut-segment ${seg.colorClass}"
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        stroke-dasharray="${strokeDash} ${strokeGap}"
        stroke-dashoffset="-${offset}"
        data-label="${seg.label}"
        data-value="${formatCurrency(seg.value)}"
        data-percent="${seg.percent}%"
      />
    `;
  }).join('');

  container.innerHTML = `
    <div class="donut-chart-wrapper">
      <svg class="donut-svg" viewBox="0 0 ${size} ${size}">
        ${segmentElements}
      </svg>
      <div class="donut-center-text">
        <span class="donut-center-label">${centerLabel}</span>
        <span class="donut-center-value">${centerValue}</span>
      </div>
    </div>
  `;
}

/**
 * Render Multi-Year Growth Stacked / Line Area Chart
 * @param {HTMLElement} container 
 * @param {{
 *   data: Array<{ year: number, invested: number, total: number }>,
 *   primaryLabel: string,
 *   secondaryLabel: string
 * }} options 
 */
export function renderGrowthChart(container, options) {
  if (!container || !options.data || options.data.length === 0) return;
  const { data, primaryLabel = 'Total Wealth', secondaryLabel = 'Invested Capital' } = options;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 65 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.total || d.futureValue || 0), 100);
  const minYear = data[0].year;
  const maxYear = data[data.length - 1].year;
  const totalYears = Math.max(1, maxYear - minYear);

  const getX = (year) => padding.left + ((year - minYear) / totalYears) * chartW;
  const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

  // Build Path Points
  const totalPoints = data.map((d) => `${getX(d.year)},${getY(d.total || d.futureValue || 0)}`).join(' ');
  const investedPoints = data.map((d) => `${getX(d.year)},${getY(d.invested || d.totalDeposits || d.totalInvested || 0)}`).join(' ');

  // Total Area Path
  const firstX = getX(minYear);
  const lastX = getX(maxYear);
  const baseY = padding.top + chartH;

  const totalAreaPath = `M ${firstX},${baseY} L ${totalPoints} L ${lastX},${baseY} Z`;
  const investedAreaPath = `M ${firstX},${baseY} L ${investedPoints} L ${lastX},${baseY} Z`;

  // Grid Lines & Y-ticks
  const yTicks = [0, maxVal * 0.5, maxVal];
  const gridLines = yTicks.map((val) => {
    const y = getY(val);
    return `
      <line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />
      <text class="chart-label-text chart-label-y" x="${padding.left - 8}" y="${y + 3}">${formatCurrency(val, undefined, false)}</text>
    `;
  }).join('');

  // X-ticks (Year markers)
  const step = Math.ceil(data.length / 6);
  const xTicks = data.filter((_, idx) => idx % step === 0 || idx === data.length - 1).map((d) => {
    const x = getX(d.year);
    return `
      <text class="chart-label-text" x="${x}" y="${height - 10}">Yr ${d.year}</text>
    `;
  }).join('');

  // Interactive Hover Circles
  const dataDots = data.map((d) => {
    const x = getX(d.year);
    const y = getY(d.total || d.futureValue || 0);
    const totVal = d.total || d.futureValue || 0;
    const invVal = d.invested || d.totalDeposits || d.totalInvested || 0;
    return `
      <circle
        class="chart-data-point"
        cx="${x}"
        cy="${y}"
        data-year="${d.year}"
        data-total="${formatCurrency(totVal)}"
        data-invested="${formatCurrency(invVal)}"
      />
    `;
  }).join('');

  container.innerHTML = `
    <div class="growth-chart-wrapper">
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        ${gridLines}
        <path class="chart-area-returns" d="${totalAreaPath}" />
        <path class="chart-area-invested" d="${investedAreaPath}" />
        <polyline class="chart-line-invested" points="${investedPoints}" />
        <polyline class="chart-line-total" points="${totalPoints}" />
        ${xTicks}
        ${dataDots}
      </svg>
      <div id="chart-tooltip-${container.id}" class="chart-tooltip"></div>
    </div>
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-swatch primary"></span>
        <span>${primaryLabel}</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch secondary dashed"></span>
        <span>${secondaryLabel}</span>
      </div>
    </div>
  `;

  // Attach hover events
  const tooltip = container.querySelector('.chart-tooltip');
  const dots = container.querySelectorAll('.chart-data-point');

  dots.forEach((dot) => {
    dot.addEventListener('mouseenter', (e) => {
      const year = dot.getAttribute('data-year');
      const total = dot.getAttribute('data-total');
      const invested = dot.getAttribute('data-invested');

      tooltip.innerHTML = `
        <strong>Year ${year}</strong><br/>
        ${primaryLabel}: ${total}<br/>
        ${secondaryLabel}: ${invested}
      `;
      tooltip.style.display = 'block';

      const rect = container.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const left = dotRect.left - rect.left + dotRect.width / 2;
      const top = dotRect.top - rect.top;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    dot.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}

/**
 * Render Amortization / Loan Prepayment Comparison Trajectory
 * @param {HTMLElement} container 
 * @param {{
 *   original: Array<{ year: number, closingBalance: number }>,
 *   revised: Array<{ year: number, closingBalance: number }>
 * }} options 
 */
export function renderComparisonChart(container, options) {
  if (!container || !options.original || options.original.length === 0) return;
  const { original, revised } = options;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 65 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(original[0].openingBalance || original[0].closingBalance, 100);
  const maxYear = Math.max(original[original.length - 1].year, 1);

  const getX = (year) => padding.left + (year / maxYear) * chartW;
  const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

  const origPoints = `0,${getY(maxVal)} ` + original.map((d) => `${getX(d.year)},${getY(d.closingBalance)}`).join(' ');
  const revPoints = `0,${getY(maxVal)} ` + revised.map((d) => `${getX(d.year)},${getY(d.closingBalance)}`).join(' ');

  // Grid Lines & Y-ticks
  const yTicks = [0, maxVal * 0.5, maxVal];
  const gridLines = yTicks.map((val) => {
    const y = getY(val);
    return `
      <line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />
      <text class="chart-label-text chart-label-y" x="${padding.left - 8}" y="${y + 3}">${formatCurrency(val, undefined, false)}</text>
    `;
  }).join('');

  // X-ticks
  const step = Math.max(1, Math.ceil(maxYear / 6));
  const xTicks = [];
  for (let yr = 0; yr <= maxYear; yr += step) {
    const x = getX(yr);
    xTicks.push(`<text class="chart-label-text" x="${x}" y="${height - 10}">Yr ${yr}</text>`);
  }

  container.innerHTML = `
    <div class="growth-chart-wrapper">
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        ${gridLines}
        <polyline class="chart-line-original" points="${origPoints}" />
        <polyline class="chart-line-revised" points="${revPoints}" />
        ${xTicks.join('')}
      </svg>
    </div>
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-swatch primary"></span>
        <span>With Prepayment (Accelerated)</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch secondary dashed"></span>
        <span>Original Schedule</span>
      </div>
    </div>
  `;
}
