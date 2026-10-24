/**
 * Finculator Official Brand Logo Component
 * Renders the official brand emblem (3D growth 'F' with rising arrow)
 */

export function getLogoSVG(size = 32, theme = 'light') {
  return `<img src="docs/images/finculator-icon.png" width="${size}" height="${size}" alt="Finculator Official Logo" class="brand-logo-img" style="filter: drop-shadow(0 2px 8px rgba(2, 132, 252, 0.3));" />`;
}

export function getOfficialLogoMarkup(size = 38) {
  return `
    <div class="brand-logo-wrap">
      <img src="docs/images/finculator-icon.png" alt="Finculator Official Logo" class="brand-logo-img" width="${size}" height="${size}" style="filter: drop-shadow(0 2px 8px rgba(2, 132, 252, 0.25));" />
    </div>
    <div class="brand-info">
      <span class="brand-title"><span class="brand-title-blue">FIN</span>CULATOR</span>
      <span class="brand-tagline">Smart Decisions. Stronger Futures.</span>
    </div>
  `;
}
