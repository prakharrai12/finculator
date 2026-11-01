# Cloud WAF & Edge Security Integration Guide

This guide details the procedure for activating Web Application Firewall (WAF) managed rules and edge rate limits across **Vercel** and **Cloudflare** for Finculator.

---

## 1. Vercel WAF & Edge Firewall Configuration

Vercel provides native edge security and firewall rules integrated directly into the deployment network.

### 1.1 Enable Vercel Managed System Rules
1. Navigate to the **Vercel Dashboard** > **Project** (`finculator`) > **Security** tab.
2. Under **Attack Challenge Mode**:
   * Set status to **Automatic** (triggers JS challenge only when suspicious DDoS spikes occur).
3. Under **Managed Rules (OWASP Core Ruleset)**:
   * Toggle **OWASP Top 10 Protections** to **Active / Block**.
   * Covers: SQL Injection, Cross-Site Scripting (XSS), Remote File Inclusion, and Command Injection.
4. Under **Vercel Bot Protection**:
   * Enable **Bot Protection** to challenge or block automated scraping engines and headless browser crawlers.

### 1.2 Configure Custom Edge Rate Limiting Rules
In the **Security** > **Firewall** section, add the following rules:

* **Rule 1: Auth Brute-Force Defense**
  * **Condition:** Path starts with `/api/auth/`
  * **Limit:** 10 requests per 1 minute per IP
  * **Action:** Challenge (or Rate Limit 429)

* **Rule 2: AI Spend Ceiling Defense**
  * **Condition:** Path starts with `/api/ai/`
  * **Limit:** 30 requests per 1 minute per IP
  * **Action:** Rate Limit 429

---

## 2. Cloudflare Pages & WAF Configuration

If routing traffic through Cloudflare or deploying via Cloudflare Pages:

### 2.1 Activate Cloudflare Managed Ruleset
1. In the **Cloudflare Dashboard**, select your domain > **Security** > **WAF**.
2. Under **Managed Rules**:
   * Deploy **Cloudflare Managed Ruleset** (Sensitivity: Medium/High).
   * Deploy **Cloudflare OWASP Core Ruleset** (Paranoia Level: 1 or 2, Score Threshold: 40).

### 2.2 Import Custom WAF Ruleset
The rules defined in [`cloudflare-waf-rules.json`](cloudflare-waf-rules.json) can be applied via the Cloudflare Dashboard or Terraform:

1. **Malicious Scanner Blocking:**
   ```sql
   (http.user_agent contains "sqlmap" or http.user_agent contains "nikto" or http.user_agent contains "acunetix" or http.user_agent contains "dirbuster" or http.user_agent contains "nessus")
   ```
   * **Action:** Block

2. **HTTP TRACE / TRACK Method Defense:**
   ```sql
   (http.request.method in {"TRACE" "TRACK"})
   ```
   * **Action:** Block

3. **Data & Dotfile Isolation:**
   ```sql
   (http.request.uri.path contains "/data/" or http.request.uri.path contains "/.env" or http.request.uri.path contains "/.git")
   ```
   * **Action:** Block

4. **Bot Fight Mode:**
   * Navigate to **Security** > **Bots** and toggle **Bot Fight Mode** to ON.

---

## 3. Defense-in-Depth Layering

| Protection Layer | Component | Responsible Filter |
|:---|:---|:---|
| **Layer 1: CDN / Edge WAF** | Cloudflare / Vercel Edge | DDoS absorption, OWASP Managed Rules, Bot challenge, Geo-IP rules |
| **Layer 2: Edge Serverless** | `api/ai.js`, `functions/api/ai.js` | Origin allowlist, CSRF validation, header-based Gemini auth, prompt length cap |
| **Layer 3: Backend Runtime** | `server.py` | Sliding window IP rate limiter, progressive delay, account lockout, scrypt+pepper, input validation |
