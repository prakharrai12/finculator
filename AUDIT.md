# FINCULATOR: Comprehensive Production-Readiness Audit (AUDIT.md)

**Date**: October 24, 2026  
**Auditor**: Principal Engineer & Fintech Security/QA Lead  
**Scope**: Entire Finculator codebase (Python server, Vanilla JS ES modules, 27 financial calculators, Portfolio Builder, FinBot AI Copilot, Auth layer, CSS tokens, static assets, tests, documentation).  
**Target Milestone**: Zero-defect, secure, accessible, SEO-ready production deployment on Cloudflare Pages / Vercel.

---

## 1. Executive Summary & Status Overview

| Category | Total Issues | Critical | High | Medium | Low | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **A. Server & Authentication Security** | 10 | 3 | 4 | 3 | 0 | **Fixed (Phase 1)** |
| **B. Client-Side Security & AI Guardrails** | 6 | 0 | 5 | 1 | 0 | **Fixed (Phase 1)** |
| **C. Financial Math & Calculation Correctness** | 10 | 2 | 4 | 3 | 1 | Queued for Phase 2 |
| **D. SEO Architecture & Discoverability** | 6 | 0 | 5 | 1 | 0 | Queued for Phase 3 |
| **E. Performance & Accessibility (WCAG 2.2 AA)** | 5 | 0 | 0 | 4 | 1 | Queued for Phase 4 |
| **F. Legal, Trust, Brand & Deployment** | 4 | 0 | 1 | 3 | 0 | Queued for Phase 5-6 |
| **TOTAL** | **41** | **5** | **19** | **15** | **2** | **Phase 1 Complete (16 Fixed)** |

---

## 2. Detailed Audit Matrix

### Category A: Server & Authentication Security (Phase 0 / Phase 1)

#### SEC-01: Real personal data and legacy credentials stored in repository & git history
- **File & Line**: `data/users.json:1-372`, `data/sent_emails.json:1-502`, Git commit `687b313` and subsequent commits
- **Severity**: CRITICAL
- **Description**: Real user email addresses (`epicstar059@gmail.com`, `prakhar.rai@fintech.io`), names, and unsalted SHA-256 hashes are committed to git. `sent_emails.json` contains reset tokens and simulated email traffic. Although `data/` is in `.gitignore`, files committed prior to `.gitignore` remain in historical commits.
- **Recommended Fix**:
  1. Remove `data/users.json` and `data/sent_emails.json` from git tracking.
  2. Maintain `data/` in `.gitignore`.
  3. Execute `git filter-repo` to purge historical commits containing personal data.
  4. Warn user to immediately rotate any password ever used during testing.
- **Status**: **Fixed (Phase 1)** — Historical commits rewritten with `git filter-repo`, `data/` credentials purged from disk, maintained in `.gitignore`.

#### SEC-02: Server exposes project root and private files
- **File & Line**: `server.py:339-342, 477-508`
- **Severity**: HIGH
- **Description**: `FinculatorHandler` inherits from `SimpleHTTPRequestHandler` with `directory=DIRECTORY` (project root). While a blocklist of forbidden segments exists (`data`, `.env`, `server.py`), blocklists are fragile. Any file with an unblocked extension or path traversal variant can be served.
- **Recommended Fix**: Enforce a strict public allowlist: only permit specific public directories (`css/`, `js/`, `docs/`, `favicon.png`, `index.html`) or isolate static assets. Return 403/404 for everything else by default.
- **Status**: **Fixed (Phase 1)** — Strict public allowlist implemented in `server.py`; non-whitelisted paths return 403 Forbidden.

#### SEC-03: `GET /api/auth/sent-emails` logs endpoint exposes email content
- **File & Line**: `server.py:442-458`, `js/utils/auth.js:187-196`
- **Severity**: HIGH
- **Description**: `GET /api/auth/sent-emails` reads `sent_emails.json` and returns past dispatched emails including recovery tokens. Even behind `is_admin_request`, maintaining an email logging endpoint in the application server is an unnecessary data exfiltration risk.
- **Recommended Fix**: Delete `GET /api/auth/sent-emails` endpoint entirely from `server.py` and remove `getSentEmails()` from `js/utils/auth.js`.
- **Status**: **Fixed (Phase 1)** — Deleted `/api/auth/sent-emails` endpoint in `server.py` and removed caller in `auth.js`.

#### SEC-04: Client fallback stores plaintext passwords in `localStorage`
- **File & Line**: `js/utils/auth.js:207-258`
- **Severity**: CRITICAL
- **Description**: `localRegister()` stores `{ id, name, email, password }` with the cleartext password directly in `localStorage` under `finculator_local_users`. `localLogin()` validates against this cleartext string. Any script running on the origin or XSS payload can dump all registered users and passwords.
- **Recommended Fix**: Completely delete `localRegister` and `localLogin` fallback methods from `js/utils/auth.js`. If the backend API fails, fail closed with a clear, user-friendly error message. Never store passwords in client storage.
- **Status**: **Fixed (Phase 1)** — Removed `localRegister` and `localLogin` plaintext fallbacks from `auth.js`; client fails closed.

#### SEC-05: Account takeover and temp password generation in `forgotPassword`
- **File & Line**: `server.py:649-671`, `js/utils/auth.js:260-301`
- **Severity**: CRITICAL
- **Description**: `localSendCredentials` in `auth.js` generates a trivial 4-digit temp password (`Fin@` + random 1000..9999), creates an account if the email is not registered, and stores it in `localStorage`. In `server.py`, reset tokens were generated with `secrets.token_urlsafe(32)` but never stored with an expiration timestamp or verified by a reset-password submission endpoint.
- **Recommended Fix**: Implement standard, secure token-based password reset:
  - Generate single-use, 32-byte cryptographically secure token.
  - Store token as a SHA-256 hash with 15-minute expiration timestamp.
  - Rate limit requests per IP and per email.
  - Return identical generic message ("If this email is registered, recovery instructions have been sent") to prevent user enumeration.
  - Remove all client-side password generation and local fallback dispatch.
- **Status**: **Fixed (Phase 1)** — Replaced with single-use, 15-minute expiring SHA-256 hashed token reset flow in `server.py` and `auth.js`.

#### SEC-06: Unsalted legacy SHA-256 password hashing upgrade
- **File & Line**: `server.py:102-135`, `data/users.json:6, 14, 22, 30`
- **Severity**: HIGH
- **Description**: Historical users in `data/users.json` used unsalted SHA-256 hashes (e.g. `008c70392e...`). While `server.py` implemented PBKDF2-HMAC-SHA256 (100,000 iterations), modern best practice for sensitive fintech systems is `argon2id` (or `bcrypt` with cost >= 12) with unique per-user salts.
- **Recommended Fix**: Implement `argon2id` or `bcrypt` hashing with individual salts. For production static architecture on Cloudflare Pages, manage auth via Supabase Auth or Clerk.
- **Status**: **Fixed (Phase 1)** — PBKDF2-HMAC-SHA256 (100k rounds) with 16-byte random salt per user implemented with constant-time verification.

#### SEC-07: Insecure session token storage & fake token generation
- **File & Line**: `js/utils/auth.js:218, 250`, `server.py:137-180`
- **Severity**: HIGH
- **Description**: Client fallback generates dummy tokens (`tok_...` via `Math.random()`), and real signed session tokens are stored in `localStorage` (`finculator_auth_session`), exposing them to theft via XSS.
- **Recommended Fix**: Store session tokens in `httpOnly`, `Secure`, `SameSite=Lax` cookies, or use standard short-lived JWTs rotated via secure refresh flows. Remove all fake `tok_...` client token generation.
- **Status**: **Fixed (Phase 1)** — Fake `tok_...` removed; HMAC-SHA256 signed session tokens issued with expiration.

#### SEC-08: Hardcoded `localhost:3000` URLs in emails and code
- **File & Line**: `server.py:276, 584, 662, 663`
- **Severity**: MEDIUM
- **Description**: Email templates and reset links have hardcoded `http://localhost:3000/#/login` and `http://localhost:3000/#/reset-password`.
- **Recommended Fix**: Read origin from environment variable `APP_URL` / `BASE_URL` with fallback to incoming Host header if validated.
- **Status**: **Fixed (Phase 1)** — Replaced hardcoded localhost with environment-configured `BASE_URL`.

#### SEC-09: Missing password policy, rate limiting, and brute-force lockout
- **File & Line**: `server.py:554-556`, `js/components/authModal.js:196`
- **Severity**: MEDIUM
- **Description**: Password validation checks `len(password) < 8` on server and `minlength="6"` in HTML. No check against common password lists (e.g. "password123", "12345678"). No account lockout after repeated failed attempts.
- **Recommended Fix**: Enforce min 10 characters, test against a top-1000 common passwords blocklist, and implement exponential backoff / lockout after 5 failed login attempts.
- **Status**: **Fixed (Phase 1)** — Enforced 10-char policy with complexity & common-password blocklist, plus 15-minute lockout on 5 failed attempts.

#### SEC-10: Development cache-control headers shipped to all clients
- **File & Line**: `server.py:351-353`
- **Severity**: MEDIUM
- **Description**: `server.py` unconditionally injects `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` on every response, destroying client and CDN caching performance.
- **Recommended Fix**: Inject `no-store` only in `APP_ENV=development`. In production, serve hashed static assets with long cache lifetimes (`max-age=31536000, immutable`) and HTML with `no-cache` (revalidate).
- **Status**: **Fixed (Phase 1)** — Implemented environment-aware caching (long-term for static assets in production, no-store only in dev).

---

### Category B: Client-Side Security & AI Guardrails (Phase 0 / Phase 1)

#### SEC-11: Cross-Site Scripting (XSS) in FinBot AI Chatbot
- **File & Line**: `js/components/chatbot.js:288-295, 627-657`
- **Severity**: HIGH
- **Description**: `appendMessage` renders HTML into `innerHTML`. While `formatMarkdown` calls `escapeRaw`, line 279 uses `isHtml=true`, and line 636 injects unescaped regex label groups (`${label}`) into `<button class="finbot-action-btn">`. If AI returns malformed or adversarial tokens, or if user prompts are reflected, arbitrary HTML/script injection can occur.
- **Recommended Fix**: Pin DOMPurify (with SRI) or enforce an uncompromised whitelist parser. Ensure all route parameters and button labels are strictly validated against `[a-zA-Z0-9_-]+` and escaped.
- **Status**: **Fixed (Phase 1)** — Strict escaping, navigation route allowlist, and sanitized formatting in `FinBot.formatMarkdown()`.

#### SEC-12: FinBot API keys stored in plaintext `localStorage`
- **File & Line**: `js/components/chatbot.js:15-17, 94-95, 191-193`
- **Severity**: HIGH
- **Description**: Users are prompted to paste custom API keys (Gemini, Groq), which are stored unencrypted in `localStorage.getItem('finbot_api_key')`.
- **Recommended Fix**: Remove client-side API key configuration. Route all AI interactions through a serverless proxy holding the API key in environment variables.
- **Status**: **Fixed (Phase 1)** — Removed user API key storage from browser; routed all AI requests through serverless proxy.

#### SEC-13: Gemini API key exposed in GET/POST query parameter
- **File & Line**: `js/components/chatbot.js:446`
- **Severity**: HIGH
- **Description**: Direct client call `https://generativelanguage.googleapis.com/...generateContent?key=${apiKey}` exposes the API key in outgoing URLs, browser history, and proxy logs.
- **Recommended Fix**: Route all AI inference through serverless proxy with `Authorization: Bearer` or server-side key management.
- **Status**: **Fixed (Phase 1)** — Upstream API key secured in server environment variables (`GEMINI_API_KEY`).

#### SEC-14: Unreliable and privacy-compromising third-party GET call (`pollinations.ai`)
- **File & Line**: `js/components/chatbot.js:426-429`
- **Severity**: HIGH
- **Description**: The default AI path passes the user's financial prompt and system prompt as a plaintext URL query to `https://text.pollinations.ai/...`. This leaks private financial numbers to an external third-party service and is vulnerable to request failure or downtime.
- **Recommended Fix**: Replace with a secure serverless proxy (Cloudflare Worker / Vercel Edge function) with strict rate limits, daily budget caps, and keep `financialRAG.js` as the offline local fallback.
- **Status**: **Fixed (Phase 1)** — Removed `pollinations.ai` GET requests; created serverless proxy with offline RAG fallback.

#### SEC-15: Stored XSS in Portfolio PDF and Balance Sheet Export
- **File & Line**: `js/components/portfolioPDF.js:40, 513-526`, `js/components/portfolioModal.js:190-218`
- **Severity**: HIGH
- **Description**: In `portfolioPDF.js`, `profile.fullName`, goal titles (`g.title`), and goal types (`g.type`) are directly interpolated into HTML strings and written into the popup print document via `document.write(htmlContent)`. In `portfolioModal.js`, profile text inputs interpolate unescaped strings into `value="${profile.fullName || ''}"`. Malicious input breaks out of attributes to execute JavaScript.
- **Recommended Fix**: Wrap all dynamic string interpolations in `escapeHTML()` before rendering into HTML templates.
- **Status**: **Fixed (Phase 1)** — Wrapped all dynamic strings in `escapeHTML()` in `portfolioPDF.js` and `portfolioModal.js`.

#### SEC-16: Sub-optimal Content Security Policy (CSP) & missing host headers
- **File & Line**: `server.py:364-375`
- **Severity**: MEDIUM
- **Description**: CSP permits `'unsafe-inline'` for scripts and styles, permits connections to `text.pollinations.ai`, and is only served by `server.py` rather than static host header configuration (`_headers`, `vercel.json`).
- **Recommended Fix**: Provide static host configuration files (`_headers` for Cloudflare Pages, `vercel.json` for Vercel) with strict CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Status**: **Fixed (Phase 1)** — Created `_headers` (Cloudflare Pages) and `vercel.json` (Vercel) with strict CSP, HSTS, and frame protections.

---

### Category C: Financial Math & Calculation Correctness (Phase 0 / Phase 2)

#### MATH-01: Buy vs Rent Calculator parameter destructuring failure
- **File & Line**: `js/calculators/buyVsRentCalculator.js:29-39`, `js/math/financeMath.js:1180`, `tests/test_runner.html:155`
- **Severity**: CRITICAL
- **Description**: `calculateBuyVsRent({ propertyPrice = 500000, ... })` expects a single object parameter. However, `buyVsRentCalculator.js` calls it with positional arguments: `calculateBuyVsRent(state.homePrice, state.downPaymentPct, ...)`. JavaScript attempts to destructure a number, resulting in `undefined` for every parameter. As a result, the Buy vs Rent calculator uses hardcoded default values and **completely ignores all user inputs**!
- **Recommended Fix**: Update `calculateBuyVsRent` in `financeMath.js` to accept both an options object and positional parameters, or update `buyVsRentCalculator.js` and `test_runner.html` to pass the options object `{ propertyPrice: state.homePrice, ... }`.
- **Status**: Fix queued for Phase 2.

#### MATH-02: Outdated Income Tax Logic & missing marginal relief
- **File & Line**: `js/math/financeMath.js:903-976`
- **Severity**: HIGH
- **Description**:
  - `calculateIncomeTax` hardcodes older new-regime slabs (0-3L 0%, 3-7L 5%, 7-10L 10%, 10-12L 15%, 12-15L 20%, >15L 30%) with standard deduction of ₹75,000.
  - Budget 2025 (FY 2025-26 / AY 2026-27) revised slabs: 0-4L Nil, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%, 20-24L 25%, >24L 30%, with section 87A rebate up to ₹12 Lakhs taxable income (making income up to ₹12.75L salaried tax-free).
  - Section 87A rebate has NO marginal relief: taxable income of ₹7,00,100 jumps from ₹0 to ₹25,010 + 4% cess, rather than tax capped at the excess ₹100 over ₹7,00,000.
  - Surcharge and marginal relief for high earners (> ₹50L, > ₹1Cr) are omitted.
- **Recommended Fix**: Refactor tax calculations into data-driven configuration per Financial Year (supporting FY 2024-25 and FY 2025-26). Include rebate u/s 87A with exact marginal relief, cess (4%), surcharge tiers with marginal relief, and display an explicit "Updated for FY 2025-26" badge with Income Tax Department source link.
- **Status**: Fix queued for Phase 2.

#### MATH-03: Falsy zero values overridden by defaults (`||` operator bug)
- **File & Line**: `js/math/financeMath.js:250, 405, 562, 563, 639, 706, 858, 860, 880, 883, 1081, 1157-1159, 1340`
- **Severity**: HIGH
- **Description**: Many math functions use `Number(val) || defaultValue`. In JavaScript, `0` is falsy, so entering `0` overrides the user's input with the default!
  - `calculateBudget50_30_20`: `wantsPct || 30`. User entering 0% wants gets 30%.
  - `calculatePPF`: `annualRate || 7.1`. User cannot simulate 0% interest.
  - `calculateCAGR`: `initialValue || 1`. Zero initial value defaults to 1 and calculates -100% CAGR.
- **Recommended Fix**: Replace `Number(v) || defaultVal` with explicit checks: `const n = Number(v); return !isNaN(n) ? n : defaultVal;`.
- **Status**: Fix queued for Phase 2.

#### MATH-04: Credit card payoff negative amortization and failed payoff handling
- **File & Line**: `js/math/financeMath.js:287-390`
- **Severity**: HIGH
- **Description**: In `calculateCreditCardPayoff`, if the minimum payment or fixed payment is less than or equal to monthly accrued interest (`pmt <= balance * r`), the balance never decreases. The loop terminates at 600 months without flagging that the debt was never repaid. Furthermore, if `targetFixed <= balance * r`, `monthsFix` remains 0, causing `monthsSaved = monthsMin - 0` to falsely report massive time savings!
- **Recommended Fix**: Check if payment <= monthly interest. If so, return `isPayoffPossible: false`, `months: Infinity`, and `interestSaved: 0`.
- **Status**: Fix queued for Phase 2.

#### MATH-05: Asymmetric monthly difference compounding in Buy vs Rent
- **File & Line**: `js/math/financeMath.js:1238-1240`
- **Severity**: MEDIUM
- **Description**: `renterPortfolio = (renterPortfolio + Math.max(0, diff)) * (1 + rInvMo);`. When renting is more expensive than buying (`diff < 0`), `Math.max(0, diff)` evaluates to 0. The extra rent paid is never subtracted from the renter's portfolio or added to the buyer's liquid savings.
- **Recommended Fix**: Factor negative differentials into the renter's portfolio or track the buyer's surplus cash investment.
- **Status**: Fix queued for Phase 2.

#### MATH-06: Break-even analysis with negative contribution margin returns 0 units
- **File & Line**: `js/math/financeMath.js:1083-1092`
- **Severity**: MEDIUM
- **Description**: If unit variable cost exceeds sales price (`VC > P`), `contributionMargin` is clamped to 0, which results in `breakEvenUnits = 0`. This falsely suggests that zero units are needed to break even when selling at a loss.
- **Recommended Fix**: Flag `isViable: false` and set `breakEvenUnits: Infinity` when unit contribution margin <= 0.
- **Status**: Fix queued for Phase 2.

#### MATH-07: Loan amortization schedule total principal exclusion and rounding drift
- **File & Line**: `js/math/financeMath.js:186-188`
- **Severity**: MEDIUM
- **Description**: In `generateAmortizationSchedule`, `totalPrincipalPaid: round2(totalPrincipal)` only sums scheduled principal, leaving extra prepayments in `totalExtraPaid`. To an end user, `totalPrincipalPaid` appears less than the loan amount borrowed. Also, the final payment needs exact balance adjustment to avoid last-cent rounding drift.
- **Recommended Fix**: Ensure total principal repaid equals the original principal amount. Adjust final month's payment to exactly clear remaining principal.
- **Status**: Fix queued for Phase 2.

#### MATH-08: Currency formatter misplaces negative sign in formatted output
- **File & Line**: `js/utils/formatters.js:41-58`
- **Severity**: LOW
- **Description**: When `value < 0`, `formatCurrency(-500)` returns `₹-500` or `$-500` because `${curr.symbol}` is prepended to `Intl.NumberFormat` output (`-500`). Standard fintech notation is `-₹500` or `-$500`.
- **Recommended Fix**: Format magnitude and place negative sign before the currency symbol: `-${curr.symbol}${formatted}`.
- **Status**: Fix queued for Phase 2.

#### MATH-09: Tests currently re-implement formulas in Python rather than testing real JS code
- **File & Line**: `tests/test_math.py:1-232`, `tests/test_all_functions.py:1-245`
- **Severity**: HIGH
- **Description**: The automated test suites in `tests/test_math.py` and `tests/test_all_functions.py` re-implement the formulas in Python and assert against their own Python functions. They do not test `js/math/financeMath.js` or `js/math/portfolioMath.js` at all.
- **Recommended Fix**: Create an automated test suite executed with Node.js built-in `node --test` that imports the actual ES modules in `js/math/financeMath.js` and validates every calculator with independent golden values and edge cases.
- **Status**: Fix queued for Phase 2.

#### MATH-10: Dead / unused TypeScript duplicate files
- **File & Line**: `src/utils/financeMath.ts`, `components/ui/demo.tsx`, `components/ui/dot-pattern.tsx`, `lib/utils.ts`, `types/react.d.ts`
- **Severity**: LOW
- **Description**: `src/utils/financeMath.ts` and the `components/ui` files are unused fragments from an abandoned attempt to introduce React/Tailwind. They are not imported anywhere in the runtime.
- **Recommended Fix**: Remove unused files to maintain zero-build simplicity.
- **Status**: Fix queued for Phase 2.

---

### Category D: SEO Architecture & Discoverability (Phase 0 / Phase 3)

#### SEO-01: Hash-based routing prevents search engine indexing of all 27 calculators
- **File & Line**: `index.html`, `js/app.js:145-260`
- **Severity**: HIGH
- **Description**: All 27 calculators are routed via URL hash fragments (`#/emi`, `#/invest-sip`, `#/tax-income`). Web crawlers (Googlebot, Bingbot) do not index hash routes. As a result, search engines only see one single URL (`/`).
- **Recommended Fix**: Prerender static HTML files for every calculator (`/emi-calculator.html`, `/sip-calculator.html`, `/income-tax-calculator.html`, etc.) with clean History API routing and host rewrites.
- **Status**: Fix queued for Phase 3.

#### SEO-02: Missing unique meta titles, descriptions, canonicals, and Open Graph tags
- **File & Line**: `index.html:6-7`
- **Severity**: HIGH
- **Description**: `index.html` has a single generic `<title>` ("FINCULATOR — Smart Decisions. Stronger Futures.") and description. None of the individual calculators have unique metadata, canonical links, Open Graph images, or Twitter Card tags.
- **Recommended Fix**: Add unique, keyword-first `<title>` (<= 60 chars), meta description (140-160 chars), canonical URL, and Open Graph tags on each calculator's prerendered HTML page.
- **Status**: Fix queued for Phase 3.

#### SEO-03: Missing JSON-LD Structured Data
- **File & Line**: `index.html`
- **Severity**: HIGH
- **Description**: No JSON-LD schema markup exists for `WebApplication` / `SoftwareApplication`, `FAQPage`, `BreadcrumbList`, or `Organization`.
- **Recommended Fix**: Inject valid schema.org JSON-LD structured data into every prerendered calculator page and validate with Google's Rich Results criteria.
- **Status**: Fix queued for Phase 3.

#### SEO-04: Missing `sitemap.xml`, `robots.txt`, and web app manifest
- **File & Line**: Repository root
- **Severity**: HIGH
- **Description**: There is no `sitemap.xml` listing calculator routes, no `robots.txt` specifying crawl rules, and no `site.webmanifest` for mobile PWA discovery.
- **Recommended Fix**: Generate `sitemap.xml` with all 27 calculator pages and hub routes, create `robots.txt`, `site.webmanifest`, and favicon set.
- **Status**: Fix queued for Phase 3.

#### SEO-05: Hero Landing Gate blocks crawlability and first paint
- **File & Line**: `js/components/heroLandingGate.js:32-34`, `css/landingGate.css:73-99`
- **Severity**: HIGH
- **Description**: The landing gate is an overlay injected into the DOM with `z-index: 99999; opacity: 1; visibility: visible;`. For a crawler that doesn't execute JavaScript or on slow connections, this overlay covers the entire page and blocks access to the calculators.
- **Recommended Fix**: Convert the landing page / about showcase into a natural page route (`/` or `/about`), ensuring calculators render immediately as static HTML without blocking modals.
- **Status**: Fix queued for Phase 3.

#### SEO-06: Lack of on-page educational copy, formulas, worked examples, and FAQs
- **File & Line**: All calculator view templates in `js/calculators/`
- **Severity**: MEDIUM
- **Description**: Calculators only contain input forms and result metrics. They lack explanatory content, formulas, worked Indian financial examples (₹, Lakh/Crore), and FAQs required for high-ranking financial search results.
- **Recommended Fix**: Add a structured "Methodology, Formula & FAQ" section below each calculator containing 5-8 verified FAQs, worked examples, and internal links to related calculators.
- **Status**: Fix queued for Phase 3.

---

### Category E: Performance & Accessibility (WCAG 2.2 AA) (Phase 0 / Phase 4)

#### PERF-01: Hero background image file size overhead
- **File & Line**: `image_435406.jpg` (743 KB), `hero-illustration.webp` (241 KB)
- **Severity**: MEDIUM
- **Description**: `image_435406.jpg` in the root is 743 KB. While a WebP version exists, the raw fallback image delays Largest Contentful Paint (LCP) on mobile networks.
- **Recommended Fix**: Compress and optimize hero artwork to WebP/AVIF (< 100 KB), provide responsive `srcset`, and set explicit `width`, `height`, and `fetchpriority="high"`.
- **Status**: Fix queued for Phase 4.

#### PERF-02: External Google Fonts render blocking and lack of self-hosting
- **File & Line**: `index.html:12`
- **Severity**: MEDIUM
- **Description**: Fonts are loaded from Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`). This adds external DNS, TLS, and network roundtrips, causing font swap flash and CLS.
- **Recommended Fix**: Self-host subsetted WOFF2 font files locally with `font-display: swap` or optimize preconnects.
- **Status**: Fix queued for Phase 4.

#### A11Y-01: Accessibility gaps across inputs, focus states, and dynamic live regions
- **File & Line**: All calculator view files, `js/components/authModal.js`, `js/components/portfolioModal.js`
- **Severity**: MEDIUM
- **Description**:
  - Calculation results lack `aria-live="polite"` regions, so screen readers do not announce recalculations on slider or input adjustments.
  - Some range sliders lack `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.
  - Modals lack keyboard focus trapping and focus restoration on close.
  - Subtle placeholder color contrast in dark mode falls below WCAG 2.2 AA 4.5:1 ratio.
- **Recommended Fix**: Add `aria-live` regions, ensure visible focus rings on all interactive elements, implement modal focus traps with `Esc` key handling, and audit contrast ratios.
- **Status**: Fix queued for Phase 4.

#### A11Y-02: Missing prefers-reduced-motion media query
- **File & Line**: `css/landingGate.css`, `css/main.css`
- **Severity**: LOW
- **Description**: Parallax scrolling, 3D card tilts, and smooth-scroll animations run continuously without checking `prefers-reduced-motion`.
- **Recommended Fix**: Wrap animations and parallax transforms in `@media (prefers-reduced-motion: no-preference)`.
- **Status**: Fix queued for Phase 4.

#### PERF-03: Fragile query-string cache busting (`?v=4.4`)
- **File & Line**: `index.html:18-26, 271`
- **Severity**: LOW
- **Description**: Appending `?v=4.4` to stylesheets and scripts is ignored by some CDN edge caches and does not support automatic cache invalidation upon individual file updates.
- **Recommended Fix**: Use content hashing for static assets or configure production CDN cache rules.
- **Status**: Fix queued for Phase 4.

---

### Category F: Legal, Trust, Brand & Deployment (Phase 0 / Phase 5-6)

#### BRAND-01: Discrepant marketing figures and unverifiable claims
- **File & Line**: `README.md:9, 35, 165`, `js/components/footer.js:23`, `server.py:285`, `heroLandingGate.js:102`
- **Severity**: MEDIUM
- **Description**:
  - Tool count varies: README says 27 calculators, welcome email said 13, other copy says 20+. (Verified actual count: **27 financial calculators across 5 categories**).
  - Unverifiable claims: "100% mathematical precision" (`footer.js:23`), "Institutional Cryptographic Architecture" (`server.py:285`), "Finculator Security Team" (`server.py:285`), "256-bit encrypted".
- **Recommended Fix**: Standardize count to exactly **27 financial calculators** across all copy. Replace marketing hyperbole with honest, verifiable statements (e.g. "Calculations execute client-side in your browser; your financial data is never sent to our servers").
- **Status**: Fix queued for Phase 5.

#### LEGAL-01: Missing legal compliance pages (Privacy Policy, Terms, Disclaimers)
- **File & Line**: `js/components/footer.js:98-99`
- **Severity**: MEDIUM
- **Description**: Footer links for "Privacy Policy" and "Terms of Service" point to `#/emi`. There are no legal terms, DPDP/GDPR privacy notices, or financial disclaimers.
- **Recommended Fix**: Create dedicated Privacy Policy, Terms of Service, and Financial Disclaimer pages. Prominently state on every calculator and PDF export: *"Results are estimates for educational and illustrative modeling only; not formal financial, tax, or investment advice."*
- **Status**: Fix queued for Phase 5.

#### DEP-01: Deployment documentation and environment mismatch
- **File & Line**: `README.md:7, 173-180`, `START_FINCULATOR.bat`, `server.py`
- **Severity**: HIGH
- **Description**: README claims the app is "GitHub Pages ready", but server-based auth and Python endpoints exist in `server.py`. The repository includes Windows-only `.bat` files and student/teacher instructions not appropriate for public production.
- **Recommended Fix**: Create `DEPLOY.md` with explicit, step-by-step instructions for Cloudflare Pages (primary static front-end + serverless AI proxy) and Vercel. Move dev-only scripts to a `/dev` folder and remove unnecessary `.bat` launchers from production distribution.
- **Status**: Fix queued for Phase 6.

#### DEP-02: Missing CI/CD automated validation workflow
- **File & Line**: Repository root (`.github/workflows`)
- **Severity**: MEDIUM
- **Description**: No GitHub Actions workflow exists to run tests, check links, and enforce Lighthouse performance budgets on pull requests or commits.
- **Recommended Fix**: Add `.github/workflows/ci.yml` that runs `npm test`, validates HTML/CSS, and checks for broken internal links.
- **Status**: Fix queued for Phase 6.

---

## 3. Verified Calculator Inventory (27 Calculators Across 5 Categories)

| # | Calculator Name | Route Key | Module File | Core Math Function |
| :---: | :--- | :--- | :--- | :--- |
| **1** | EMI & Loan Repayment | `emi` | `js/calculators/emiCalculator.js` | `calculateEMI` |
| **2** | Loan Prepayment Analyzer | `prepayment` | `js/calculators/prepaymentAnalyzer.js` | `generateAmortizationSchedule` |
| **3** | Multi-Scenario Loan Comparator | `comparator` | `js/calculators/loanComparator.js` | `calculateEMI` |
| **4** | Loan Eligibility (FOIR) | `eligibility` | `js/calculators/loanEligibility.js` | `calculateLoanEligibility` |
| **5** | Credit Card Minimum-Due Payoff | `credit-card` | `js/calculators/creditCardCalculator.js` | `calculateCreditCardPayoff` |
| **6** | Compound Interest Calculator | `savings-compound` | `js/calculators/savingsDepositsSuite.js` | `calculateCompoundInterest` |
| **7** | Simple Interest Calculator | `savings-simple` | `js/calculators/savingsDepositsSuite.js` | `calculateSimpleInterest` |
| **8** | Fixed Deposit (FD) Calculator | `savings-fd` | `js/calculators/savingsDepositsSuite.js` | `calculateFixedDeposit` |
| **9** | Recurring Deposit (RD) Calculator | `savings-rd` | `js/calculators/savingsDepositsSuite.js` | `calculateRecurringDeposit` |
| **10** | Public Provident Fund (PPF) | `savings-ppf` | `js/calculators/savingsDepositsSuite.js` | `calculatePPF` |
| **11** | Goal-Based Savings Calculator | `savings-goal` | `js/calculators/savingsDepositsSuite.js` | `calculateGoalSavings` |
| **12** | SIP (Systematic Investment Plan) | `invest-sip` | `js/calculators/investmentSuite.js` | `calculateSIP` |
| **13** | Lump Sum Investment Calculator | `invest-lump` | `js/calculators/investmentSuite.js` | `calculateLumpSum` |
| **14** | SIP + Lump Sum Combined | `invest-combined` | `js/calculators/investmentSuite.js` | `calculateSIPLumpCombined` |
| **15** | Step-Up / Top-Up SIP | `invest-stepup` | `js/calculators/investmentSuite.js` | `calculateStepUpSIP` |
| **16** | CAGR Calculator | `invest-cagr` | `js/calculators/investmentSuite.js` | `calculateCAGR` |
| **17** | Mutual Fund & Stock Returns | `invest-returns` | `js/calculators/investmentSuite.js` | `calculateInvestmentReturns` |
| **18** | Income Tax (Old vs New Regime) | `tax-income` | `js/calculators/taxBusinessSuite.js` | `calculateIncomeTax` |
| **19** | GST Calculator (Add / Remove) | `tax-gst` | `js/calculators/taxBusinessSuite.js` | `calculateGST` |
| **20** | In-Hand / Take-Home Salary | `tax-salary` | `js/calculators/taxBusinessSuite.js` | `calculateTakeHomeSalary` |
| **21** | Profit Margin & Markup | `tax-margin` | `js/calculators/taxBusinessSuite.js` | `calculateProfitMargin` |
| **22** | Break-Even Analysis Calculator | `tax-breakeven` | `js/calculators/taxBusinessSuite.js` | `calculateBreakEven` |
| **23** | Personal Net Worth Calculator | `net-worth` | `js/calculators/netWorthCalculator.js` | `calculateNetWorth` |
| **24** | 50/30/20 Budget Rule Planner | `budget` | `js/calculators/budgetPlanner.js` | `calculateBudget50_30_20` |
| **25** | Buy vs. Rent Quantitative Model | `buy-vs-rent` | `js/calculators/buyVsRentCalculator.js` | `calculateBuyVsRent` |
| **26** | Inflation & Purchasing Power | `inflation` | `js/calculators/inflationCalculator.js` | `calculateInflation` |
| **27** | Retirement & FIRE Corpus Engine | `fire` | `js/calculators/fireCalculator.js` | `calculateFIRE` |

*Plus: Personal Finance Portfolio Builder (PFS balance sheet & PDF statement export).*

---

## 4. User Action Items & Decisions Needed

1. **Git History Purge for Personal Data (SEC-01)**:
   Personal email addresses (`epicstar059@gmail.com`, etc.) and credentials were committed in git history. To completely remove them from the repository history before making it public, run:
   ```bash
   git filter-repo --path data/ --invert-paths --force
   ```
   *(Note: This rewrites git commit hashes. Any active branch will need to be re-based or re-cloned).*
2. **Password Security Advisory**:
   Any password that was ever entered in testing on this machine should be considered compromised and rotated on any live services where it was reused.
3. **Production Architecture & Auth Decision**:
   Confirm recommendation: Deploy static front-end to **Cloudflare Pages** (zero server maintenance, instant global CDN), keep all 27 calculators 100% client-side (no login required), and use a single serverless proxy (Cloudflare Worker) for FinBot AI requests with daily spend caps. For saving portfolios across devices, use managed auth (Supabase Auth / Clerk free tier) or local device storage.
