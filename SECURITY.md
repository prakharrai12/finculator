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
   - **Minimum Password Length**: 12 characters (per NIST SP 800-63B).
   - **Password Complexity**: Requires uppercase, lowercase, numbers, and special characters.
   - **Breached & Common Password Check**: Checked against extensive lists of compromised passwords and dictionary patterns.
   - **No Forced Periodic Rotation**: Adheres to modern security guidelines discouraging arbitrary credential rotation.
   - **Password Storage**: Passwords are cryptographically salted and hashed using memory-hard `scrypt` (N=16384, r=8, p=1) with a server-side HMAC-SHA256 pepper.
   - **Password Resets**: Password reset tokens are single-use, cryptographically secure (256-bit random), time-limited (15-minute expiration), and hashed with SHA-256 at rest.
   - **Anti-Enumeration & Timing Defense**: Authentication and reset endpoints return uniform, timing-safe error responses using dummy scrypt derivations to prevent timing-based user enumeration.
   - **Email Verification**: Required upon registration with single-use, 24-hour expiring verification tokens.

4. **Multi-Factor Authentication (MFA)**:
   - **TOTP Authenticators**: Standards-compliant RFC 6238 time-based one-time password generation compatible with Google Authenticator, Authy, and 1Password.
   - **Hashed Recovery Codes**: 8 single-use cryptographically random backup recovery codes, hashed at rest and consumed upon use.
   - **Re-Authentication**: Mandatory password and MFA verification for sensitive profile and credential changes.

5. **Sessions & Access Control**:
   - **HttpOnly Cookies**: Session tokens are issued via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies to eliminate client-side token exposure to XSS.
   - **Session Fixation Defense**: Session identifiers (`sid`) are regenerated upon login and privilege transitions.
   - **Server-Side Invalidation**: Instant token revocation on `/api/auth/logout` and "Logout Everywhere" across all devices via session versioning on `/api/auth/logout-all`.
   - **IDOR / BOLA Prevention**: User data operations strictly resolve the subject identity server-side from cryptographically signed session tokens.

6. **Rate Limiting & Abuse Prevention**:
   - Authentication endpoints enforce strict per-IP and per-account rate limits.
   - Progressive execution delay is applied after repeated failed attempts, followed by a 15-minute account lockout after 5 failures.

7. **Logging & Monitoring**:
   - Immutable security audit log (`data/audit_log.json`) tracking logins, failures, MFA activations, and session revocations with zero credential leakage.
   - Automated email sign-in notifications dispatched to users on new session logins.

8. **AI Guardrails (FinBot)**:
   - The AI Assistant routes requests through an isolated, authenticated serverless proxy holding the upstream API key securely in environment variables.
   - User inputs and AI outputs are strictly sanitized to prevent Cross-Site Scripting (XSS).
   - Prompts are never transmitted via GET query parameters to untrusted third-party services.
   - Educational disclaimers are enforced: FinBot results are estimates for educational modeling, not formal financial advice.

9. **Content Security Policy & HTTP Headers**:
   - `Content-Security-Policy`: Disallows unsafe inline scripts/styles where feasible, limits script sources to trusted origins with Subresource Integrity (SRI).
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (and `frame-ancestors 'none'`)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Cross-Origin-Opener-Policy: same-origin`

---

## 3. Scope & Supported Versions

| Version | Status | Security Support |
| :--- | :--- | :--- |
| **v4.x (Latest)** | Supported | Active security patches and vulnerability remediation |
| **v3.x and earlier** | Unsupported | End of life; users must upgrade to v4.x |
