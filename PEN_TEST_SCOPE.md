# Finculator Penetration Testing Scope & Rules of Engagement (ROE)

**Document Version:** 1.0.0  
**Effective Date:** November 2026  
**Target:** Finculator Wealth Platform & Financial Calculation Engine  
**Contact:** security@finculator.app  

---

## 1. Executive Authorization & Safe Harbor

This document defines the authorized scope, rules of engagement, and testing methodology for external penetration testing assessments, gray-box audits, and bug bounty programs conducted against the Finculator platform.

Any security testing performed strictly in compliance with this document is authorized by Finculator and protected under our safe harbor policy. We will not pursue legal action against researchers acting in good faith.

---

## 2. Target Scope Definition

### 2.1 In-Scope Assets

| Target Asset | Type | Description |
|:---|:---|:---|
| `https://finculator-black.vercel.app` | Production Web App | Primary hosted deployment on Vercel Edge |
| `https://finculator.vercel.app` | Production Alias | Production vanity alias |
| `/api/auth/*` | REST API | Registration, Login, Forgot Password, Reset Password, MFA, Logout |
| `/api/user/*` | REST API | Profile view (`GET`) and profile updates (`PUT`) |
| `/api/ai/*` | Edge Function | FinBot AI proxy endpoint |
| `/api/portfolio/upload` | REST API | Portfolio file upload & JSON validation |
| `/api/newsletter/*` | REST API | Subscriber management |
| Client-Side Calculators (31 Pages) | Client SPA / Math | 27 Financial calculators, Portfolio Builder, and local state engines |

### 2.2 Out-of-Scope Assets

The following targets and methods are strictly **OUT OF SCOPE**:
* Direct attacks against upstream Google Gemini infrastructure (`*.googleapis.com`).
* Volumetric Distributed Denial of Service (DDoS) designed to exhaust bandwidth.
* Physical attacks against facilities or hardware.
* Social engineering, phishing, or vishing targeting developers or users.
* Deletion or corruption of real user data in production.

---

## 3. Testing Methodology & Focus Areas

Penetration testers are requested to focus on the following categories aligned with **OWASP ASVS v4.0 (Level 2)**:

### 3.1 Authentication & Credential Security
* Verification of `scrypt` hashing with server-side pepper.
* Brute-force resilience, timing attack uniform latency, and 5-attempt account lockout.
* Single-use token invalidation on password reset and email verification.
* RFC 6238 TOTP replay attacks and recovery code consumption logic.

### 3.2 Authorization & Access Control (IDOR / BOLA)
* Multi-tenant boundary checks on `/api/user/profile`: attempt reading or updating another user's profile by manipulating request parameters or user IDs.
* Privilege escalation: attempt invoking `/api/admin/*` endpoints without valid admin credentials or `X-Admin-Key`.
* Horizontal privilege escalation on portfolio imports.

### 3.3 Session Management & Token Integrity
* JWT signature tampering: test `alg: "none"` rejection, expired tokens, tampered payloads, and secret key brute-force.
* Session invalidation: verify that `/api/auth/logout` and `/api/auth/logout-all` immediately revoke token validity server-side.
* Cookie flag enforcement (`HttpOnly`, `SameSite=Lax`, `Secure`).

### 3.4 Injection & Input Validation
* Stored / Reflected / DOM Cross-Site Scripting (XSS) across calculator inputs, portfolio note fields, and FinBot Markdown renderer.
* Path traversal via `/api/portfolio/upload` and static asset routing.
* Server-Side Request Forgery (SSRF) via the AI proxy.
* Open Redirects on `/api/auth/login?next=...`.

### 3.5 Financial Computation Business Logic
* Negative amortization loan traps (verifying correct warnings when interest exceeds payment).
* Section 87A Marginal Relief tax calculation accuracy under Budget 2025.
* Precision and rounding drift attacks on 30-year amortization curves.

---

## 4. Test Accounts & Credential Provisioning

To facilitate gray-box testing, test accounts with designated roles can be requested:
* **Account 1 (Unprivileged User):** `tester-user@example.com` (Standard user role).
* **Account 2 (Unprivileged Victim):** `victim-user@example.com` (Target for IDOR tests).
* **Account 3 (Administrative User):** Available in dedicated staging environments with `X-Admin-Key` authorization.

---

## 5. Vulnerability Reporting & Severity SLA

### 5.1 Reporting Format
Vulnerability reports must be submitted with:
1. Vulnerability Title & Classification (e.g. OWASP category).
2. CVSS v3.1 Vector & Base Score.
3. Target Endpoint and HTTP Method.
4. Step-by-Step Reproduction Guide with non-destructive Proof of Concept (PoC).
5. Business Impact Analysis.
6. Recommended Remediation.

### 5.2 Remediation Timeframe (SLA)

| Severity | CVSS v3.1 Range | Remediation SLA |
|:---|:---:|:---:|
| **Critical** | 9.0 – 10.0 | **24 Hours** |
| **High** | 7.0 – 8.9 | **72 Hours** |
| **Medium** | 4.0 – 6.9 | **14 Days** |
| **Low / Informational** | 0.1 – 3.9 | **30 Days** |
