/**
 * Finculator Hero Section Component
 * Rendered strictly according to the layout schematic:
 * Top Navigation -> Left Column with Upper Breathing Room & Lower Title Block -> Right Column with Large Visual Card.
 */

export function renderHeroSection(container, callbacks = {}) {
  if (!container) return;

  container.innerHTML = `
    <section class="finculator-hero-section" id="finculator-hero-view">
      <div class="hero-layout-grid">
        
        <!-- Left Column: Open space above with Title block placed in lower portion -->
        <div class="hero-left-column">
          <!-- Top Eyebrow Feature Pill -->
          <div class="hero-top-eyebrow">
            <div class="hero-pill-badge">
              <span class="hero-pill-dot"></span>
              Institutional Financial Architecture
            </div>
          </div>

          <!-- Lower Title Block (Blue Box in schematic) -->
          <div class="hero-title-box">
            <h1 class="hero-main-title">
              Smart Financial Decisions. <br/>
              <span class="hero-title-highlight">Stronger Futures.</span>
            </h1>
            <p class="hero-description">
              Next-generation financial computation engine to calculate, compare, and optimize loans, wealth compounding, retirement trajectories, and institutional portfolios with mathematical accuracy.
            </p>

            <!-- Quick Action CTA Row -->
            <div class="hero-actions-row">
              <a href="#/emi" class="btn-hero-primary" id="hero-btn-explore">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Explore Calculators
              </a>
              <button type="button" class="btn-hero-secondary" id="hero-btn-portfolio">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                My Portfolio
              </button>
              <button type="button" class="btn-hero-secondary" id="hero-btn-signin">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                Sign In / Access
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Large Image Block (Pink Box in schematic) -->
        <div class="hero-right-column">
          <div class="hero-image-box">
            <!-- 3D Isometric FinTech Dashboard Visual -->
            <img 
              src="docs/images/finculator-hero-visual.jpg" 
              alt="Finculator 3D Isometric Financial Computation Engine & Portfolio Dashboard" 
              class="hero-image-visual"
              loading="eager"
            />

            <!-- Top Left Floating Glass Chip -->
            <div class="hero-floating-chip chip-top-left">
              <div class="chip-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              </div>
              <div class="chip-content">
                <span class="chip-title">13 Financial Engines</span>
                <span class="chip-sub">Zero-Preset Slate</span>
              </div>
            </div>

            <!-- Bottom Right Floating Glass Chip -->
            <div class="hero-floating-chip chip-bottom-right">
              <div class="chip-icon" style="background: linear-gradient(135deg, #10B981, #059669);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div class="chip-content">
                <span class="chip-title">Institutional PDF Export</span>
                <span class="chip-sub">Advisory-Grade Reports</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  `;

  // Attach button events
  const portBtn = container.querySelector('#hero-btn-portfolio');
  if (portBtn) {
    portBtn.addEventListener('click', () => {
      const mainPortBtn = document.querySelector('#btn-open-portfolio');
      if (mainPortBtn) mainPortBtn.click();
    });
  }

  const signinBtn = container.querySelector('#hero-btn-signin');
  if (signinBtn && callbacks.openAuth) {
    signinBtn.addEventListener('click', () => callbacks.openAuth('signin'));
  }
}
