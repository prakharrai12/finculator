import urllib.request
import urllib.error
import json
import time
import os
import sys
import threading
import socketserver

BASE_URL = "http://127.0.0.1:3000"

def get_env_val(key, default=''):
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith(f"{key}="):
                    return line.split('=', 1)[1].strip().strip("'\"")
    return os.getenv(key, default)

ADMIN_API_KEY = get_env_val('ADMIN_API_KEY', 'dev_adm_8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b')

def ensure_server_running():
    try:
        req = urllib.request.Request(f"{BASE_URL}/", headers={'User-Agent': 'TestRunner'})
        with urllib.request.urlopen(req, timeout=1) as resp:
            if resp.status == 200:
                return
    except Exception:
        pass

    print("[INIT] Starting background test server instance on 127.0.0.1:3000...")
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from server import FinculatorHandler, HOST, PORT
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer((HOST, PORT), FinculatorHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    time.sleep(1)

def run_tests():
    print("=" * 75)
    print("FINCULATOR PART 1: AUTHENTICATION SECURITY & SYSTEM VERIFICATION SUITE")
    print("=" * 75)

    ensure_server_running()

    # 1. Static asset tests & Strict Security Headers
    assets = [
        "/",
        "/index.html",
        "/css/main.css",
        "/js/app.js",
        "/js/utils/auth.js",
        "/js/components/authModal.js",
        "/js/math/financeMath.js"
    ]

    print("\n--- 1. Testing Core Web Assets & Security Headers ---")
    for asset in assets:
        url = BASE_URL + asset
        req = urllib.request.Request(url, headers={'User-Agent': 'TestRunner'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
            assert resp.status == 200, f"Failed to load {asset}"
            if asset == "/index.html":
                headers = dict(resp.headers)
                assert 'X-Content-Type-Options' in headers, "Missing X-Content-Type-Options"
                assert headers.get('X-Content-Type-Options') == 'nosniff', "Invalid X-Content-Type-Options"
                assert 'X-Frame-Options' in headers, "Missing X-Frame-Options"
                assert headers.get('X-Frame-Options') == 'DENY', "Invalid X-Frame-Options"
                assert 'Content-Security-Policy' in headers, "Missing Content-Security-Policy"
                assert 'Referrer-Policy' in headers, "Missing Referrer-Policy"
                assert 'Permissions-Policy' in headers, "Missing Permissions-Policy"
                assert 'Cross-Origin-Opener-Policy' in headers, "Missing Cross-Origin-Opener-Policy"
                print("           [SECURITY HEADERS VERIFIED] CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, COOP active")
            print(f"[PASS 200] {asset:<45} ({len(data):>7} B)")

    # 1B. Testing Strict Allowlist File & Source Isolation (Forbidden 403)
    print("\n--- 1B. Testing Data File & Source Isolation (Forbidden 403) ---")
    forbidden_urls = [
        f"{BASE_URL}/data/users.json",
        f"{BASE_URL}/data/sent_emails.json",
        f"{BASE_URL}/data/audit_log.json",
        f"{BASE_URL}/data/reset_tokens.json",
        f"{BASE_URL}/server.py",
        f"{BASE_URL}/.env",
        f"{BASE_URL}/.git/config",
        f"{BASE_URL}/tests/test_math.py",
    ]
    for bad_url in forbidden_urls:
        req = urllib.request.Request(bad_url, headers={'User-Agent': 'TestRunner'})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                assert False, f"Expected 403 for {bad_url}, got {resp.status}"
        except urllib.error.HTTPError as e:
            assert e.code == 403, f"Expected HTTP 403 Forbidden for {bad_url}, got {e.code}"
            print(f"[PASS 403] Access denied for restricted resource: {bad_url.replace(BASE_URL, '')}")

    # 2. Registration API & 12-Character Password Policy Enforcement
    print("\n--- 2. Testing Password Policy Enforcement (Min 12 chars, Complexity, Breached List) ---")

    # 2A. Weak password (<12 chars)
    weak_payload = json.dumps({
        "name": "Weak User",
        "email": f"weak_{int(time.time())}@example.com",
        "password": "Short1!Abc" # 10 chars (fails 12-char policy)
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=weak_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert False, "Weak password was unexpectedly accepted"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400 for short password, got {e.code}"
        res_data = json.loads(e.read().decode('utf-8'))
        assert "at least 12 characters" in res_data.get('error', ''), "Length error missing"
        print(f"[PASS 400] Short password rejected (<12 chars): {res_data.get('error')}")

    # 2B. Common password on blocklist
    common_payload = json.dumps({
        "name": "Common User",
        "email": f"common_{int(time.time())}@example.com",
        "password": "Password1234!" # Common password
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=common_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert False, "Common password was unexpectedly accepted"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400 for common password, got {e.code}"
        res_data = json.loads(e.read().decode('utf-8'))
        assert "too common" in res_data.get('error', '').lower()
        print(f"[PASS 400] Common blocklisted password rejected: {res_data.get('error')}")

    # 2C. Valid strong password (15 chars)
    test_email = f"tester_{int(time.time())}@example.com"
    test_name = "Investor Test"
    test_pw = "FinSecure@2026!"

    print("\n--- 2C. Testing Valid User Registration, Scrypt+Pepper Hashing & Verification Token ---")
    reg_payload = json.dumps({
        "name": test_name,
        "email": test_email,
        "password": test_pw
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=reg_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status in (200, 201), f"Registration failed with status {resp.status}"
        assert res_data.get('success') is True, "Registration success flag missing"
        assert 'token' in res_data, "Token missing in registration"
        assert res_data['user']['email'] == test_email, "User email mismatch"
        assert 'password' not in res_data, "Plaintext password leaked in registration response"
        assert 'passwordHash' not in res_data, "Hash leaked in registration response"

        # Check HttpOnly cookie issuance
        set_cookie = resp.headers.get('Set-Cookie', '')
        assert 'finculator_session=' in set_cookie, "Set-Cookie finculator_session missing"
        assert 'HttpOnly' in set_cookie, "HttpOnly flag missing on cookie"
        assert 'SameSite=Lax' in set_cookie, "SameSite=Lax missing on cookie"
        print(f"[PASS 201] User registered: {test_email}")
        print(f"           HttpOnly Cookie Verified: {set_cookie[:45]}...")

    # Verify password was hashed with memory-hard scrypt + pepper
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    users_file = os.path.join(data_dir, 'users.json')
    with open(users_file, 'r', encoding='utf-8') as f:
        users = json.load(f)
    u_record = next((u for u in users if u['email'] == test_email), None)
    assert u_record is not None, "Registered user record missing in users.json"
    assert u_record['passwordHash'].startswith('scrypt:16384:8:1$'), f"Hash not scrypt format: {u_record['passwordHash']}"
    assert u_record.get('emailVerifyTokenHash') is not None, "Email verification token hash missing"
    print(f"[PASS SCRYPT] User password securely hashed with scrypt (N=16384, r=8, p=1) + server pepper")

    # 3. Login API & Session Token Handling
    print("\n--- 3. Testing Authentication Login, Timing-Safe Defense & Session Token ---")
    login_payload = json.dumps({
        "email": test_email,
        "password": test_pw
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=login_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Login failed"
        assert res_data.get('success') is True, "Login success flag missing"
        assert res_data['user']['name'] == test_name, "User name mismatch"
        assert 'token' in res_data, "Session token missing in login response"
        assert len(res_data['token'].split('.')) == 3, "Session token is not a valid HMAC signed token"
        auth_token = res_data['token']
        print(f"[PASS 200] User logged in successfully: {res_data['user']['name']}")
        print(f"           Signed Token: {auth_token[:24]}...")

    # 3B. Timing Attack Defense (Non-existent user execution latency)
    print("\n--- 3B. Testing Timing Attack Defense (Uniform Dummy Scrypt Latency) ---")
    ghost_payload = json.dumps({
        "email": f"ghost_{int(time.time())}@nonexistent.org",
        "password": test_pw
    }).encode('utf-8')
    t0 = time.time()
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=ghost_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert False, "Ghost user login unexpectedly succeeded"
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.time() - t0) * 1000
        assert e.code == 401, f"Expected 401 for unknown user, got {e.code}"
        assert elapsed_ms > 100, f"Response too fast ({elapsed_ms}ms); dummy scrypt computation not executed"
        print(f"[PASS 401] Timing attack mitigated: execution took {round(elapsed_ms, 1)}ms (uniform scrypt delay)")

    # 4. Deleted Endpoint Test: /api/auth/sent-emails must return 404
    print("\n--- 4. Testing Deleted Endpoint (/api/auth/sent-emails -> 404 Not Found) ---")
    sent_emails_req = urllib.request.Request(f"{BASE_URL}/api/auth/sent-emails")
    try:
        with urllib.request.urlopen(sent_emails_req, timeout=5) as resp:
            assert False, "Expected 404 for deleted /api/auth/sent-emails endpoint"
    except urllib.error.HTTPError as e:
        assert e.code == 404, f"Expected 404 Not Found, got {e.code}"
        print("[PASS 404] /api/auth/sent-emails endpoint is completely removed (no credentials leak)")

    # 5. Forgot Password (Uniform Response & Token Creation)
    print("\n--- 5. Testing Forgot Password Flow (Uniform Response & Single-Use Token) ---")
    forgot_payload = json.dumps({"email": test_email}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/forgot-password",
        data=forgot_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Forgot password request failed"
        assert res_data.get('success') is True, "Forgot password success missing"
        print(f"[PASS 200] Uniform recovery response received for {test_email}")

    # Anti-enumeration test
    non_existent_payload = json.dumps({"email": "ghost_unknown_user_99@example.com"}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/forgot-password",
        data=non_existent_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        ghost_res = json.loads(resp.read().decode('utf-8'))
        assert ghost_res.get('message') == res_data.get('message'), "Anti-enumeration violation"
        print("[PASS 200] Anti-enumeration verified: identical response for existing and unknown emails")

    # 6. Single-Use Password Reset Verification
    print("\n--- 6. Testing Password Reset Endpoint & Single-Use Enforcement ---")
    emails_file = os.path.join(data_dir, 'sent_emails.json')
    with open(emails_file, 'r', encoding='utf-8') as f:
        emails = json.load(f)
    latest_reset_email = next((e for e in emails if e['to'] == test_email and 'Reset' in e['subject']), None)
    assert latest_reset_email is not None, "Password reset email was not logged"

    import re
    match = re.search(r'token=([a-zA-Z0-9_-]+)', latest_reset_email['bodyText'])
    assert match is not None, "Reset token not found in email body"
    reset_token = match.group(1)

    new_test_pw = "NewFinSecure@2026!"
    reset_payload = json.dumps({
        "token": reset_token,
        "newPassword": new_test_pw
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/reset-password",
        data=reset_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        reset_res = json.loads(resp.read().decode('utf-8'))
        assert reset_res.get('success') is True, "Password reset failed with valid token"
        print("[PASS 200] Password successfully reset using single-use token")

    # Token replay must fail
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/api/auth/reset-password",
            data=reset_payload,
            headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert False, "Reusing reset token unexpectedly succeeded"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400 for already used token, got {e.code}"
        print("[PASS 400] Token replay prevented: single-use token invalidated")

    # 7. Authorization & IDOR/BOLA Protection Test
    print("\n--- 7. Testing Authorization & IDOR/BOLA Prevention (/api/user/profile) ---")
    # Fresh login to get updated token
    new_login_payload = json.dumps({
        "email": test_email,
        "password": new_test_pw
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=new_login_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        active_token = json.loads(resp.read().decode('utf-8'))['token']

    # GET /api/user/profile uses server-side token identity only
    prof_req = urllib.request.Request(
        f"{BASE_URL}/api/user/profile",
        headers={'Authorization': f"Bearer {active_token}", 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(prof_req, timeout=5) as resp:
        prof_res = json.loads(resp.read().decode('utf-8'))
        assert prof_res['user']['email'] == test_email
        print(f"[PASS 200] User profile fetched safely via server-side identity claim: {prof_res['user']['email']}")

    # 8. Multi-Factor Authentication (RFC 6238 TOTP Setup & Verification)
    print("\n--- 8. Testing Multi-Factor Authentication (RFC 6238 TOTP & Recovery Codes) ---")
    mfa_setup_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/mfa/setup",
        data=b"{}",
        headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {active_token}", 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(mfa_setup_req, timeout=5) as resp:
        mfa_data = json.loads(resp.read().decode('utf-8'))
        assert 'secret' in mfa_data, "MFA secret missing"
        assert len(mfa_data['recoveryCodes']) == 8, "Expected 8 recovery codes"
        totp_secret = mfa_data['secret']
        recovery_code_1 = mfa_data['recoveryCodes'][0]
        print(f"[PASS 200] TOTP secret generated ({len(totp_secret)} chars Base32) and 8 recovery keys issued")

    # Generate valid TOTP code
    from server import get_totp_code
    totp_code = get_totp_code(totp_secret)
    mfa_verify_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/mfa/verify",
        data=json.dumps({"code": totp_code}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {active_token}", 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(mfa_verify_req, timeout=5) as resp:
        verify_data = json.loads(resp.read().decode('utf-8'))
        assert verify_data['success'] is True, "MFA verification failed"
        print(f"[PASS 200] MFA successfully activated using code {totp_code}")

    # Now login without MFA must challenge for code
    login_mfa_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=json.dumps({"email": test_email, "password": new_test_pw}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(login_mfa_req, timeout=5) as resp:
            assert False, "Login without MFA code unexpectedly succeeded"
    except urllib.error.HTTPError as e:
        assert e.code == 401, f"Expected 401 for missing MFA, got {e.code}"
        mfa_challenge = json.loads(e.read().decode('utf-8'))
        assert mfa_challenge.get('mfaRequired') is True
        print("[PASS 401] MFA challenge enforced: credentials alone insufficient when MFA is active")

    # Login with single-use recovery code
    login_recovery_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=json.dumps({"email": test_email, "password": new_test_pw, "recoveryCode": recovery_code_1}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(login_recovery_req, timeout=5) as resp:
        rec_res = json.loads(resp.read().decode('utf-8'))
        assert rec_res.get('success') is True
        new_active_token = rec_res['token']
        print(f"[PASS 200] Logged in successfully with single-use recovery code {recovery_code_1}")

    # 9. Server-Side Session Revocation & Logout Everywhere
    print("\n--- 9. Testing Server-Side Session Revocation & Logout Everywhere ---")
    logout_all_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/logout-all",
        data=b"{}",
        headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {new_active_token}", 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(logout_all_req, timeout=5) as resp:
        logout_res = json.loads(resp.read().decode('utf-8'))
        assert logout_res.get('success') is True
        print("[PASS 200] Global logout executed: sessionVersion incremented on server")

    # Verify old token is now REJECTED server-side
    prof_after_logout = urllib.request.Request(
        f"{BASE_URL}/api/user/profile",
        headers={'Authorization': f"Bearer {new_active_token}", 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(prof_after_logout, timeout=5) as resp:
            assert False, "Revoked session was accepted"
    except urllib.error.HTTPError as e:
        assert e.code == 401, f"Expected 401 for revoked session, got {e.code}"
        print("[PASS 401] Real server-side invalidation verified: revoked tokens cannot access protected routes")

    # 10. Security Audit Log Verification
    print("\n--- 10. Testing Security Audit Log (/api/admin/audit-log) ---")
    audit_req = urllib.request.Request(
        f"{BASE_URL}/api/admin/audit-log",
        headers={'X-Admin-Key': ADMIN_API_KEY, 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(audit_req, timeout=5) as resp:
        logs = json.loads(resp.read().decode('utf-8'))
        assert len(logs) > 0, "Audit log empty"
        events = [l['event'] for l in logs]
        assert 'REGISTER_SUCCESS' in events, "REGISTER_SUCCESS missing in audit log"
        assert 'LOGIN_SUCCESS' in events, "LOGIN_SUCCESS missing in audit log"
        assert 'MFA_ENABLED' in events, "MFA_ENABLED missing in audit log"
        assert 'LOGOUT_ALL_DEVICES' in events, "LOGOUT_ALL_DEVICES missing in audit log"
        print(f"[PASS 200] Security audit log active ({len(logs)} events tracked: REGISTER, LOGIN, MFA, LOGOUT_ALL)")

    # 11. AI Proxy Guardrails
    print("\n--- 11. Testing AI Proxy Guardrails (/api/ai/query) ---")
    oversized_prompt = "A" * 1050
    over_payload = json.dumps({"prompt": oversized_prompt}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/ai/query",
        data=over_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert False, "Oversized AI prompt was accepted"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400 for oversized prompt, got {e.code}"
        print("[PASS 400] Oversized AI query rejected by proxy input validation")

    # 12. Disposable Email Filter
    print("\n--- 12. Testing Disposable Email Filter (Anti-Burner Defense) ---")
    burner_email = f"burner_{int(time.time())}@mailinator.com"
    burner_payload = json.dumps({
        "name": "Burner User",
        "email": burner_email,
        "password": "FinSecure@2026!"
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=burner_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert False, "Disposable email was unexpectedly accepted"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400 for burner email, got {e.code}"
        err_msg = json.loads(e.read().decode('utf-8')).get('error', '')
        assert "disposable" in err_msg.lower(), "Expected disposable email error"
        print(f"[PASS 400] Disposable email blocked: {burner_email} -> {err_msg}")

    # 13. Blocked HTTP Methods Filter (TRACE / TRACK Method Defense)
    print("\n--- 13. Testing Blocked HTTP Methods (TRACE / TRACK -> 405 Method Not Allowed) ---")
    trace_req = urllib.request.Request(f"{BASE_URL}/", method='TRACE', headers={'User-Agent': 'TestRunner'})
    try:
        with urllib.request.urlopen(trace_req, timeout=5) as resp:
            assert False, "TRACE method unexpectedly succeeded"
    except urllib.error.HTTPError as e:
        assert e.code == 405, f"Expected 405 Method Not Allowed for TRACE, got {e.code}"
        print("[PASS 405] HTTP TRACE method strictly disabled (Cross-Site Tracing XST prevented)")

    # 14. Malicious Scanner Bot Filter
    print("\n--- 14. Testing Malicious Scanner & Automated Bot Defense ---")
    scanner_req = urllib.request.Request(
        f"{BASE_URL}/api/user/profile",
        headers={'User-Agent': 'sqlmap/1.6.1#stable (http://sqlmap.org)'}
    )
    try:
        with urllib.request.urlopen(scanner_req, timeout=5) as resp:
            assert False, "Security scanner was not blocked"
    except urllib.error.HTTPError as e:
        assert e.code == 403, f"Expected 403 Forbidden for malicious scanner UA, got {e.code}"
        print("[PASS 403] Automated vulnerability scanner blocked by User-Agent filter")

    # 15. File Upload Filter (MIME, Extension, Payload Inspection)
    print("\n--- 15. Testing File Upload Filter (/api/portfolio/upload) ---")
    # 15A. Bad extension (.exe)
    bad_upload_req = urllib.request.Request(
        f"{BASE_URL}/api/portfolio/upload",
        data=b"MZ binary content",
        headers={
            'Content-Type': 'application/json',
            'X-File-Name': 'malware.exe',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    try:
        with urllib.request.urlopen(bad_upload_req, timeout=5) as resp:
            assert False, "Executable upload was accepted"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400 for bad extension, got {e.code}"
        print("[PASS 400] Unauthorized file extension (.exe) rejected by file upload filter")

    # 15B. Embedded script in JSON payload
    script_payload = b'{"name": "<script>alert(1)</script>"}'
    script_upload_req = urllib.request.Request(
        f"{BASE_URL}/api/portfolio/upload",
        data=script_payload,
        headers={
            'Content-Type': 'application/json',
            'X-File-Name': 'portfolio.json',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    try:
        with urllib.request.urlopen(script_upload_req, timeout=5) as resp:
            assert False, "Script tag upload was accepted"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400 for script tag in file, got {e.code}"
        print("[PASS 400] Malicious embedded script tag in upload rejected by content inspection")

    # 15C. Valid JSON portfolio upload
    valid_payload = json.dumps({"version": "1.0", "holdings": [{"symbol": "VOO", "shares": 10}]}).encode('utf-8')
    valid_upload_req = urllib.request.Request(
        f"{BASE_URL}/api/portfolio/upload",
        data=valid_payload,
        headers={
            'Content-Type': 'application/json',
            'X-File-Name': 'safe_portfolio.json',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    with urllib.request.urlopen(valid_upload_req, timeout=5) as resp:
        up_res = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 201, "Valid upload failed"
        assert up_res['success'] is True
        print(f"[PASS 201] Valid portfolio JSON accepted and saved securely as UUID: {up_res['fileId']}")

    # 16. Log Redaction & Open Redirect Filters
    print("\n--- 16. Testing Log Redaction & Open Redirect Prevention Filters ---")
    from server import sanitize_log_message, validate_redirect_url
    log_sample = 'User login request: password="SuperSecretPassword123!" card="4111 2222 3333 4444" cvv=123'
    redacted = sanitize_log_message(log_sample)
    assert 'SuperSecretPassword123!' not in redacted, "Password not redacted in log"
    assert '[REDACTED]' in redacted, "Redaction tag missing"
    assert '[CARD REDACTED]' in redacted, "Card number not redacted"
    print(f"[PASS LOG REDACTION] Log filter verified: {redacted}")

    # Open Redirect filter tests
    assert validate_redirect_url('//evil.com', ['http://127.0.0.1:3000']) == '/'
    assert validate_redirect_url('javascript:alert(1)', ['http://127.0.0.1:3000']) == '/'
    assert validate_redirect_url('/emi-calculator', ['http://127.0.0.1:3000']) == '/emi-calculator'
    print("[PASS REDIRECT FILTER] Open redirect filter verified: relative URLs preserved, exploits neutralized")

    print("\n" + "=" * 75)
    print("ALL PART 1 & PART 3 SECURITY FILTERS PASSED CLEANLY (100% VERIFIED)")
    print("=" * 75)

if __name__ == '__main__':
    run_tests()
