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

---

## 4. Security Architecture Glossary & Implementation Mapping

This section maps critical industry security concepts directly to Finculator's actual codebase, defensive layers, and automated verification suites:

| Security Term | Industry Definition | Finculator Implementation & Safeguards |
| :--- | :--- | :--- |
| **OWASP Top 10 / ASVS** | Standard consensus lists of critical web application risks (OWASP Top 10) and Application Security Verification Standards (ASVS L1-L3). | Finculator aligns with ASVS Level 2 requirements for fintech apps: automated unit & integration suites in [`tests/`](file:///tests) verify defenses against injection, broken access, cryptographic failures, and security misconfigurations. |
| **Zero Trust** | Architectural paradigm: "Never trust, always verify." No request is trusted by default, even internally. | Every API request to [`server.py`](file:///server.py) re-validates caller authenticity, token integrity, and user session versioning; frontend claims are never trusted implicitly. |
| **Least Privilege** | Granting each identity, process, and key only the absolute minimum permissions required. | Default user accounts have zero administrative capabilities; admin endpoints require explicit `X-Admin-Key` or role elevation; serverless edge functions have scoped environment variables. |
| **Defense in Depth** | Layered security model where multiple redundant controls prevent single points of failure. | Multi-tier defense: Browser CSP $\rightarrow$ Edge CDN firewall / Vercel headers $\rightarrow$ Server rate limiter $\rightarrow$ Token cryptographic verification $\rightarrow$ Strict file allowlist. |
| **MFA / 2FA** | Multi-Factor Authentication requiring two or more independent factors of identity. | RFC 6238 TOTP time-based one-time password generation compatible with Google Authenticator, Authy, and 1Password, backed by 8 single-use cryptographically hashed recovery codes. |
| **Passkeys / WebAuthn / FIDO2** | Public-key cryptographic credentials stored on user devices providing phishing-resistant login. | Architecture prepared for WebAuthn credential registration and challenge verification via hardware security keys / platform authenticators. |
| **RBAC / ABAC** | Role-Based Access Control and Attribute-Based Access Control models. | Pure RBAC in [`server.py`](file:///server.py) separating `user` vs `admin` roles, verified on protected endpoints (`/api/admin/audit-log`, `/api/admin/subscribers`). |
| **IDOR / BOLA** | Insecure Direct Object References / Broken Object Level Authorization (manipulating IDs to access other users' records). | Protected endpoints like `GET /api/user/profile` resolve the subject ID strictly from cryptographically signed session tokens (`sub`), never from client-controlled URL/body params. |
| **Brute Force / Credential Stuffing** | Automated guessing of passwords or replaying breached credential dumps. | Mitigated via dual sliding-window rate limiting (per IP and per account), progressive backoff delay after 3 failures, and 15-minute lockout after 5 consecutive failed attempts. |
| **Session Fixation / Hijacking** | Forcing a known session ID onto a victim or intercepting an active session token. | Neutralized by generating a fresh cryptographic session ID (`sid`) on every authentication event and issuing tokens via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies. |
| **CSRF / XSS / SQLi / SSRF** | Cross-Site Request Forgery, Cross-Site Scripting, SQL Injection, and Server-Side Request Forgery. | **CSRF**: `X-Finculator-CSRF: 1` header & Origin/Referer validation.<br>**XSS**: Local context escaping (`escapeHTML`) and strict CSP.<br>**SQLi**: Zero raw SQL (JSON file storage & Jamstack static rendering).<br>**SSRF**: Upstream AI proxy enforces strict allowlisted URLs only. |
| **CSP / HSTS / CORS** | Content Security Policy, HTTP Strict Transport Security, and Cross-Origin Resource Sharing. | Strict headers enforced in [`vercel.json`](file:///vercel.json) and [`server.py`](file:///server.py): CSP restricts script sources, HSTS enforces 1-year preloadable HTTPS, and CORS disallows `*` with credentials. |
| **PKCE** | Proof Key for Code Exchange (RFC 7636) preventing authorization code interception in public clients. | OAuth architecture utilizes SHA-256 code challenge generation (`code_challenge`) and random `state` parameters to thwart eavesdropping on redirection URIs. |
| **Token Rotation** | Automatically issuing a new token and invalidating the previous token on every authentication/refresh cycle. | Passwords updates and session renewals increment the user's `sessionVersion`, automatically invalidating legacy tokens across all devices. |
| **Salting / Peppering / Hashing** | Cryptographic key derivation and one-way transformations to safeguard stored passwords. | Memory-hard `scrypt` ($N=16384, r=8, p=1$) with a unique 16-byte random salt per user and a server-side HMAC-SHA256 pepper (`PASSWORD_PEPPER`). |
| **Rate Limiting / Throttling** | Enforcing rate ceilings on request frequency to prevent abuse and denial of service. | Thread-safe sliding-window `RateLimiter` enforces independent thresholds for authentication (`AUTH_RATE_LIMIT_PER_MIN`) and general API calls (`API_RATE_LIMIT_PER_MIN`). |
| **WAF** | Web Application Firewall filtering and blocking malicious HTTP traffic at the network edge. | Cloudflare / Vercel edge firewall layers filter automated bot floods, malformed payloads, and DDoS traffic prior to reaching compute resources. |
| **SAST / DAST / SCA** | Static Application Security Testing, Dynamic Application Security Testing, and Software Composition Analysis. | Automated GitHub CI pipeline runs `npm test` (SAST/functional), `python tests/test_auth_and_system.py` (DAST), and dependency auditing (`npm audit`). |
| **Pen Test / Threat Modeling** | Hands-on vulnerability assessments and proactive architectural threat identification (e.g. STRIDE). | Comprehensive audit documented in [`AUDIT.md`](file:///AUDIT.md) evaluating threat vectors across authentication, data leakage, and financial calculation integrity. |
| **Secrets Management** | Dedicated storage, isolation, and injection of sensitive keys and credentials. | Zero hardcoded keys; secrets managed via `.env` with `.env*` in `.gitignore` and injected into production deployments via Vercel Environment Variables. |
| **Audit Trail** | Tamper-resistant, immutable log of critical security events and administrative actions. | High-fidelity audit log maintained in [`data/audit_log.json`](file:///data/audit_log.json) tracking logins, failures, MFA operations, and session revocations with zero credential leakage. |
