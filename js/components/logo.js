/**
 * Finculator SVG Logo Generator
 * Renders the official brand icon (Circular arc + 3 ascending chart bars + upward electric cyan/blue arrow)
 */

export function getLogoSVG(size = 32, theme = 'light') {
  const ringColor = theme === 'dark' ? '#FFFFFF' : '#0D1526';
  const bar1Color = '#2563EB';
  const bar2Color = '#3B82F6';
  const bar3Color = '#06B6D4';
  const arrowColor = '#06B6D4';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="finculator-logo-svg">
      <defs>
        <linearGradient id="finculator-arrow-grad-${theme}" x1="30" y1="70" x2="85" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563EB" />
          <stop offset="100%" stop-color="#06B6D4" />
        </linearGradient>
        <linearGradient id="finculator-bar-grad-${theme}" x1="0" y1="100" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563EB" />
          <stop offset="100%" stop-color="#06B6D4" />
        </linearGradient>
      </defs>

      <!-- Outer Dark Ring Arc with Gap for Rising Arrow -->
      <path d="M 48 10 A 38 38 0 1 0 86 48" fill="none" stroke="${ringColor}" stroke-width="12" stroke-linecap="round" />

      <!-- 3 Rising Growth Bars -->
      <!-- Bar 1 (Short) -->
      <rect x="34" y="52" width="7.5" height="20" rx="3.75" fill="${bar1Color}" />
      <!-- Bar 2 (Medium) -->
      <rect x="46" y="40" width="7.5" height="32" rx="3.75" fill="${bar2Color}" />
      <!-- Bar 3 (Tall) -->
      <rect x="58" y="28" width="7.5" height="44" rx="3.75" fill="${bar3Color}" />

      <!-- Rising Upward Arrow Line & Head -->
      <path d="M 32 68 L 76 24" fill="none" stroke="url(#finculator-arrow-grad-${theme})" stroke-width="9" stroke-linecap="round" />
      <path d="M 56 20 L 82 20 L 82 46 Z" fill="url(#finculator-arrow-grad-${theme})" stroke-linejoin="round" />
    </svg>
  `;
}
