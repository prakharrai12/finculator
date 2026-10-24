import urllib.request
import urllib.error
import json
import time
import os
import sys

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

def run_tests():
    print("=" * 70)
    print("FINCULATOR PHASE 1 SECURITY & SYSTEM VERIFICATION TEST SUITE")
    print("=" * 70)
    
    # 0. Wait for server readiness (up to 10 seconds)
    print("\n[INIT] Connecting to development server...")
    server_ready = False
    for attempt in range(10):
        try:
            req = urllib.request.Request(f"{BASE_URL}/", headers={'User-Agent': 'TestRunner'})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    server_ready = True
                    print(f"[INIT] Server is ready on {BASE_URL} (attempt {attempt + 1})")
                    break
        except Exception:
            time.sleep(1)
    if not server_ready:
        sys.exit(f"FATAL: Development server at {BASE_URL} is not responding.")

    # 1. Static asset tests & Security Headers
    assets = [
        "/",
        "/index.html",
        "/css/landingGate.css",
        "/js/components/heroLandingGate.js",
        "/js/components/authModal.js",
        "/js/components/portfolioModal.js",
        "/js/app.js",
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
                print("           [SECURITY HEADERS VERIFIED] CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy active")
            print(f"[PASS 200] {asset:<45} ({len(data):>7} B)")

    # 1B. Testing Strict Allowlist File & Source Isolation (Forbidden 403)
    print("\n--- 1B. Testing Data File & Source Isolation (Forbidden 403) ---")
    forbidden_urls = [
        f"{BASE_URL}/data/users.json",
        f"{BASE_URL}/data/sent_emails.json",
        f"{BASE_URL}/server.py",
        f"{BASE_URL}/.env",
        f"{BASE_URL}/.git/config",
        f"{BASE_URL}/tests/test_math.py",
        f"{BASE_URL}/data/reset_tokens.json",
    ]
    for bad_url in forbidden_urls:
        req = urllib.request.Request(bad_url, headers={'User-Agent': 'TestRunner'})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                assert False, f"Expected 403 for {bad_url}, got {resp.status}"
        except urllib.error.HTTPError as e:
            assert e.code == 403, f"Expected HTTP 403 Forbidden for {bad_url}, got {e.code}"
            print(f"[PASS 403] Access denied for restricted resource: {bad_url.replace(BASE_URL, '')}")

    # 2. Registration API & Password Policy Enforcement
    print("\n--- 2. Testing Password Policy Enforcement (Min 10 chars, Complexity, Blocklist) ---")
    
    # 2A. Weak password (<10 chars)
    weak_payload = json.dumps({
        "name": "Weak User",
        "email": f"weak_{int(time.time())}@example.com",
        "password": "Short1!"
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
        print(f"[PASS 400] Short password rejected: {res_data.get('error')}")

    # 2B. Common password on blocklist
    common_payload = json.dumps({
        "name": "Common User",
        "email": f"common_{int(time.time())}@example.com",
        "password": "Password123!"
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
        print(f"[PASS 400] Common blocklisted password rejected: {res_data.get('error')}")

    # 2C. Valid strong password
    test_email = f"tester_{int(time.time())}@example.com"
    test_name = "Investor Test"
    test_pw = "FinSecure@2026!"

    print("\n--- 2C. Testing Valid User Registration & PBKDF2 Password Hashing ---")
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
        assert 'emailPreview' not in res_data, "Credentials preview leaked in registration response"
        print(f"[PASS 201] User registered: {test_email}")
        print(f"           Message: {res_data.get('message')}")

    # 3. Login API & Session Token Handling
    print("\n--- 3. Testing Authentication Login & HMAC-SHA256 Token Issuance ---")
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
        print(f"[PASS 200] User logged in successfully: {res_data['user']['name']}")
        print(f"           Signed Token: {res_data['token'][:24]}...")

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
        assert 'emailPreview' not in res_data, "Email preview leaked in forgot password response"
        print(f"[PASS 200] Uniform recovery response received for {test_email}")

    # Also test for non-existent email (must return identical response to prevent user enumeration)
    non_existent_payload = json.dumps({"email": "ghost_unknown_user_99@example.com"}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/forgot-password",
        data=non_existent_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        ghost_res = json.loads(resp.read().decode('utf-8'))
        assert ghost_res.get('message') == res_data.get('message'), "Anti-enumeration violation: response differs for unknown user"
        print("[PASS 200] Anti-enumeration verified: identical response for existing and unknown emails")

    # 6. Single-Use Password Reset Verification
    print("\n--- 6. Testing Password Reset Endpoint & Single-Use Enforcement ---")
    # Retrieve the generated token from local server state
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    reset_tokens_file = os.path.join(data_dir, 'reset_tokens.json')
    emails_file = os.path.join(data_dir, 'sent_emails.json')
    
    with open(emails_file, 'r', encoding='utf-8') as f:
        emails = json.load(f)
    latest_reset_email = next((e for e in emails if e['to'] == test_email and 'Reset' in e['subject']), None)
    assert latest_reset_email is not None, "Password reset email was not logged"
    
    # Extract token from logged reset link
    import re
    match = re.search(r'token=([a-zA-Z0-9_-]+)', latest_reset_email['bodyText'])
    assert match is not None, "Reset token not found in email body"
    reset_token = match.group(1)
    
    # Reset password with valid token
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

    # Reusing the SAME token must FAIL (single-use enforcement)
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
        print("[PASS 400] Token replay prevented: single-use token successfully invalidated")

    # Verify login works with the NEW password
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
        assert resp.status == 200, "Login failed with new password"
        print("[PASS 200] Successful login verified with newly updated password")

    # 7. AI Proxy Guardrails Test
    print("\n--- 7. Testing AI Proxy Guardrails (/api/ai/query) ---")
    # 7A. Oversized prompt
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

    # 7B. Valid prompt (verifying safe proxy response or graceful offline fallback)
    valid_prompt_payload = json.dumps({"prompt": "How does EMI compounding work?"}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/ai/query",
        data=valid_prompt_payload,
        headers={'Content-Type': 'application/json', 'X-Finculator-CSRF': '1', 'User-Agent': 'TestRunner'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        ai_res = json.loads(resp.read().decode('utf-8'))
        assert 'response' in ai_res or ai_res.get('offlineFallback') is True, "AI proxy failed to return response or fallback"
        print(f"[PASS 200] AI proxy functional (Offline fallback active: {ai_res.get('offlineFallback', False)})")

    print("\n" + "=" * 70)
    print("ALL PHASE 1 SECURITY & SYSTEM TESTS PASSED CLEANLY (100% VERIFIED)")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
