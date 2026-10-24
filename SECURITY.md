# Finculator Security Policy (SECURITY.md)

**Last Updated**: October 2026  
**Security Posture**: Client-First, Privacy-Preserving Financial Architecture

---

## 1. Reporting a Vulnerability

Finculator takes the security of our users and their financial computations seriously. If you believe you have discovered a security vulnerability in Finculator, please report it immediately to our security coordination team.

### Vulnerability Reporting Channel
- **Email**: `security@finculator.app` (or open an advisory through GitHub Security Advisories)
- **Response SLA**: Initial triage within 24 hours; status updates every 48 hours until remediation.

### Responsible Disclosure Guidelines
- Please do not publicly disclose the vulnerability until it has been patched and a coordinated release is published.
- Do not attempt to access, modify, or destroy any other user's data.
- Provide comprehensive steps to reproduce, including HTTP requests, payloads, browser versions, and screen captures if applicable.

---

## 2. Core Security Guarantees & Architecture

1. **Client-Side Computing**:
   - All 27 financial calculators execute **100% locally in the user's browser**.
   - Input values (loans, salaries, investments, net worth balances) are never transmitted to our servers or stored in remote databases during standard calculator operations.

2. **Data Minimization & Storage**:
   - Saved portfolios and calculation histories reside solely in the user's browser `localStorage` or `sessionStorage` unless explicitly exported by the user (as JSON, CSV, or PDF).
   - No sensitive credentials, cleartext passwords, or private financial records are stored unhashed or unencrypted.

3. **Authentication & Password Policy**:
   - **Minimum Password Length**: 10 characters.
   - **Password Complexity**: Requires uppercase, lowercase, numbers, and special characters.
   - **Blocklist Check**: Rejects common passwords, sequential patterns, and dictionary phrases.
   - **Password Storage**: Passwords must be hashed using salted PBKDF2 (min 100,000 iterations) or Argon2id. Unsalted hashes are strictly prohibited.
   - **Password Resets**: Password reset tokens are single-use, cryptographically secure (256-bit random), time-limited (15-minute expiration), and hashed at rest.
   - **Anti-Enumeration**: Authentication and reset endpoints return uniform, timing-safe error responses regardless of whether an email exists.

4. **Rate Limiting & Abuse Prevention**:
   - Authentication endpoints enforce strict per-IP rate limits and progressive exponential backoff lockout upon consecutive failed login attempts.

5. **AI Guardrails (FinBot)**:
   - The AI Assistant routes requests through an isolated, authenticated serverless proxy holding the upstream API key securely in environment variables.
   - User inputs and AI outputs are strictly sanitized to prevent Cross-Site Scripting (XSS).
   - Prompts are never transmitted via GET query parameters to untrusted third-party services.
   - Educational disclaimers are enforced: FinBot results are estimates for educational modeling, not formal financial advice.

6. **Content Security Policy & HTTP Headers**:
   - `Content-Security-Policy`: Disallows unsafe inline scripts/styles where feasible, limits script sources to trusted origins with Subresource Integrity (SRI).
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (and `frame-ancestors 'none'`)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 3. Scope & Supported Versions

| Version | Status | Security Support |
| :--- | :--- | :--- |
| **v4.x (Latest)** | Supported | Active security patches and vulnerability remediation |
| **v3.x and earlier** | Unsupported | End of life; users must upgrade to v4.x |
