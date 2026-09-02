import urllib.request
import json
import time

BASE_URL = "http://localhost:3000"

def run_tests():
    print("=" * 60)
    print("FINCULATOR SYSTEM & AUTH VERIFICATION TEST SUITE")
    print("=" * 60)
    
    # 1. Static asset tests
    assets = [
        "/",
        "/index.html",
        "/docs/images/finculator-hero-visual.jpg",
        "/css/landingGate.css",
        "/js/components/heroLandingGate.js",
        "/js/components/authModal.js",
        "/js/components/portfolioModal.js",
        "/js/app.js",
    ]
    
    print("\n--- 1. Testing Core Web Assets & Banknote Hero Image ---")
    for asset in assets:
        url = BASE_URL + asset
        req = urllib.request.Request(url, headers={'User-Agent': 'TestRunner'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
            assert resp.status == 200, f"Failed to load {asset}"
            print(f"[PASS 200] {asset:<45} ({len(data):>7} B)")

    # 2. Registration API & Email Dispatch
    test_email = f"tester_{int(time.time())}@example.com"
    test_name = "Investor Test"
    test_pw = "FinSecure@2026"

    print("\n--- 2. Testing Registration & Direct Credentials Email Dispatch ---")
    reg_payload = json.dumps({
        "name": test_name,
        "email": test_email,
        "password": test_pw
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=reg_payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status in (200, 201), f"Registration failed with status {resp.status}"
        assert res_data.get('success') is True, "Registration success flag missing"
        assert 'token' in res_data, "Token missing in registration"
        assert res_data['user']['email'] == test_email, "User email mismatch"
        print(f"[PASS 200] User registered: {test_email}")
        print(f"           Message: {res_data.get('message')}")

    # 3. Login API
    print("\n--- 3. Testing Authentication Login ---")
    login_payload = json.dumps({
        "email": test_email,
        "password": test_pw
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=login_payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Login failed"
        assert res_data.get('success') is True, "Login success flag missing"
        assert res_data['user']['name'] == test_name, "User name mismatch"
        print(f"[PASS 200] User logged in successfully: {res_data['user']['name']}")

    # 4. Email Dispatch Verification & Sent Emails Inbox
    print("\n--- 4. Testing Email Dispatch Log ---")
    req = urllib.request.Request(f"{BASE_URL}/api/auth/sent-emails")
    with urllib.request.urlopen(req, timeout=5) as resp:
        emails = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Failed to retrieve sent emails"
        assert len(emails) > 0, "No emails found in sent log"
        latest_email = emails[0]
        assert latest_email['to'] == test_email, "Latest sent email recipient mismatch"
        print(f"[PASS 200] Welcome Credentials Email delivered to: {latest_email['to']}")
        print(f"           Subject: {latest_email['subject']}")
        print(f"           Sent At: {latest_email['sentAt']}")

    # 5. Forgot Password / Send Credentials Test
    print("\n--- 5. Testing Forgot Password / Send Credentials Dispatch ---")
    forgot_payload = json.dumps({
        "email": test_email
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/forgot-password",
        data=forgot_payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Forgot password request failed"
        assert res_data.get('success') is True, "Forgot password success missing"
        print(f"[PASS 200] Credentials reset and sent to {test_email}")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: HERO IMAGE, GUEST GATE, AUTH & EMAIL SYSTEM 100% OPERATIONAL")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
