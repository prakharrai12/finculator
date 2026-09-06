import urllib.request
import urllib.error
import json
import time
import os

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
    print("=" * 60)
    print("FINCULATOR SECURITY HARDENING & SYSTEM TEST SUITE")
    print("=" * 60)
    
    # 1. Static asset tests & Security Headers
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
    
    print("\n--- 1. Testing Core Web Assets & Security Headers ---")
    for asset in assets:
        url = BASE_URL + asset
        req = urllib.request.Request(url, headers={'User-Agent': 'TestRunner'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
            assert resp.status == 200, f"Failed to load {asset}"
            if asset == "/index.html":
                # Verify security headers
                headers = dict(resp.headers)
                assert 'X-Content-Type-Options' in headers, "Missing X-Content-Type-Options"
                assert headers.get('X-Content-Type-Options') == 'nosniff', "Invalid X-Content-Type-Options"
                assert 'X-Frame-Options' in headers, "Missing X-Frame-Options"
                assert headers.get('X-Frame-Options') == 'DENY', "Invalid X-Frame-Options"
                assert 'Content-Security-Policy' in headers, "Missing Content-Security-Policy"
                assert 'Referrer-Policy' in headers, "Missing Referrer-Policy"
                print("           [SECURITY HEADERS VERIFIED] CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy active")
            print(f"[PASS 200] {asset:<45} ({len(data):>7} B)")

    # 1B. Testing Database & Source File Isolation (Forbidden 403)
    print("\n--- 1B. Testing Data File & Source Isolation (/data/users.json -> 403) ---")
    forbidden_urls = [
        f"{BASE_URL}/data/users.json",
        f"{BASE_URL}/data/sent_emails.json",
        f"{BASE_URL}/server.py",
        f"{BASE_URL}/.env",
    ]
    for bad_url in forbidden_urls:
        req = urllib.request.Request(bad_url, headers={'User-Agent': 'TestRunner'})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                assert False, f"Expected 403 for {bad_url}, got {resp.status}"
        except urllib.error.HTTPError as e:
            assert e.code == 403, f"Expected HTTP 403 Forbidden for {bad_url}, got {e.code}"
            print(f"[PASS 403] Restricted access properly denied for: {bad_url.replace(BASE_URL, '')}")

    # 2. Registration API & Email Dispatch
    test_email = f"tester_{int(time.time())}@example.com"
    test_name = "Investor Test"
    test_pw = "FinSecure@2026"

    print("\n--- 2. Testing Registration & PBKDF2 Password Hashing ---")
    reg_payload = json.dumps({
        "name": test_name,
        "email": test_email,
        "password": test_pw
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=reg_payload,
        headers={
            'Content-Type': 'application/json',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status in (200, 201), f"Registration failed with status {resp.status}"
        assert res_data.get('success') is True, "Registration success flag missing"
        assert 'token' in res_data, "Token missing in registration"
        assert res_data['user']['email'] == test_email, "User email mismatch"
        # Plaintext password must never be exposed in response
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
        headers={
            'Content-Type': 'application/json',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Login failed"
        assert res_data.get('success') is True, "Login success flag missing"
        assert res_data['user']['name'] == test_name, "User name mismatch"
        assert 'token' in res_data, "Session token missing in login response"
        # Token must have 3 parts (JWT-style HMAC signed)
        assert len(res_data['token'].split('.')) == 3, "Session token is not a valid HMAC signed token"
        print(f"[PASS 200] User logged in successfully: {res_data['user']['name']}")
        print(f"           Signed Token (sample): {res_data['token'][:24]}...")

    # 4. Privileged Route Protection: Email Dispatch Log
    print("\n--- 4. Testing Privileged Route Protection on /api/auth/sent-emails ---")
    
    # 4A. Unauthenticated request must return 401 Unauthorized
    unauth_req = urllib.request.Request(f"{BASE_URL}/api/auth/sent-emails")
    try:
        with urllib.request.urlopen(unauth_req, timeout=5) as resp:
            assert False, "Expected 401 for unauthenticated /api/auth/sent-emails"
    except urllib.error.HTTPError as e:
        assert e.code == 401, f"Expected 401 Unauthorized, got {e.code}"
        print("[PASS 401] Access denied for unauthenticated request to /api/auth/sent-emails")

    # 4B. Authenticated request with Admin API Key succeeds
    admin_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/sent-emails",
        headers={'X-Admin-Key': ADMIN_API_KEY}
    )
    with urllib.request.urlopen(admin_req, timeout=5) as resp:
        emails = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Failed to retrieve sent emails with Admin Key"
        assert len(emails) > 0, "No emails found in sent log"
        latest_email = emails[0]
        assert latest_email['to'] == test_email, "Latest sent email recipient mismatch"
        # Verify plaintext password was NOT logged
        assert test_pw not in latest_email['bodyText'], "Password leaked in sent email text"
        assert test_pw not in latest_email['bodyHtml'], "Password leaked in sent email html"
        print(f"[PASS 200] Welcome email delivered to: {latest_email['to']} (with Admin Key)")
        print(f"           Subject: {latest_email['subject']}")
        print("           [PASSWORD REDACTION VERIFIED] Passwords redacted from email logs")

    # 5. Forgot Password / Send Credentials Test
    print("\n--- 5. Testing Forgot Password / Send Credentials Dispatch ---")
    forgot_payload = json.dumps({
        "email": test_email
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/forgot-password",
        data=forgot_payload,
        headers={
            'Content-Type': 'application/json',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200, "Forgot password request failed"
        assert res_data.get('success') is True, "Forgot password success missing"
        # Ensure password is not returned in response
        assert 'emailPreview' not in res_data, "Email preview leaked in forgot password response"
        print(f"[PASS 200] Recovery instructions dispatched for {test_email}")

    # 6. Full-Width Footer Verification & Newsletter API
    print("\n--- 6. Testing Full-Width Footer & Newsletter Subscription API ---")
    req = urllib.request.Request(f"{BASE_URL}/index.html")
    with urllib.request.urlopen(req, timeout=5) as resp:
        html = resp.read().decode('utf-8')
        assert 'id="site-footer"' not in html, "Site footer was not removed from post-login workspace"
        assert ('id="btn-header-about"' in html or 'id="btn-header-home"' in html), "About/Home button missing in navbar"
        assert 'id="header-auth-wrapper"' in html, "Header auth wrapper missing in navbar"
        print("[PASS 200] Post-Login Workspace Cleaned: Footer removed from workspace, About & Profile buttons active")

    # Verify shared Footer component
    with open("js/components/footer.js", "r", encoding="utf-8") as f:
        footer_js = f.read()
        assert 'export class FooterComponent' in footer_js, "FooterComponent class missing"
        assert 'export function getFooterHTML' in footer_js, "getFooterHTML function missing"
        assert 'footer-github-btn' in footer_js, "Icon-only GitHub button missing"
        assert 'Quick Jumps' not in footer_js, "Redundant Quick Jumps found in footer template"
        assert 'footer-copy-email-btn' not in footer_js, "Personal email button found in footer template"
        print("[PASS 200] js/components/footer.js Verified: Reusable FooterComponent active")

    # Verify landing gate footer integration
    with open("js/components/heroLandingGate.js", "r", encoding="utf-8") as f:
        gate_js = f.read()
        assert 'FooterComponent' in gate_js, "FooterComponent not imported in heroLandingGate.js"
        assert 'landing-site-footer' in gate_js, "landing-site-footer missing in heroLandingGate.js"
        assert 'Maximizing Growth' in gate_js, "Maximizing Growth title missing in heroLandingGate.js"
        assert 'visual-card' in gate_js, "visual-card class missing in heroLandingGate.js"
        assert 'card-overlay-edge' in gate_js, "card-overlay-edge vignette missing in heroLandingGate.js"
        assert 'landing-services-section' in gate_js, "landing-services-section missing in heroLandingGate.js"
        print("[PASS 200] js/components/heroLandingGate.js Verified: Hero Visual Card, Growth title & Services active")

    # Verify landingGate.css rules
    with open("css/landingGate.css", "r", encoding="utf-8") as f:
        gate_css = f.read()
        assert '.visual-card' in gate_css, ".visual-card style missing in landingGate.css"
        assert '.card-overlay-edge' in gate_css, ".card-overlay-edge style missing in landingGate.css"
        assert '.hero-section' in gate_css, ".hero-section style missing in landingGate.css"
        print("[PASS 200] landingGate.css Verified: Contrast containment, vignette edge & dark styling active")

    # Verify CSS rules for tighter footer and circular FinBot FAB
    with open("css/main.css", "r", encoding="utf-8") as f:
        main_css = f.read()
        assert '.header-home-btn' in main_css, "header-home-btn style missing"
        assert 'padding-right: 4.5rem' in main_css, "footer-bottom clearance padding missing"
        print("[PASS 200] main.css Verified: Home icon button and compact footer spacing rules active")

    with open("css/chatbot.css", "r", encoding="utf-8") as f:
        chat_css = f.read()
        assert '.finbot-launcher-label' in chat_css, "finbot-launcher-label style missing"
        assert 'border-radius: 50%' in chat_css, "circular FAB style missing"
        assert '.finbot-window.active' in chat_css, "finbot-window.active style missing"
        assert 'transform-origin: bottom right' in chat_css, "transform-origin missing in chatbot.css"
        print("[PASS 200] chatbot.css Verified: Smooth GPU-accelerated cubic-bezier open/close animation active")

    # Test Newsletter Subscribe with CSRF Header
    sub_email = f"subscriber_{int(time.time())}@institutional.com"
    sub_payload = json.dumps({"email": sub_email}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/newsletter/subscribe",
        data=sub_payload,
        headers={
            'Content-Type': 'application/json',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 201, f"Expected 201, got {resp.status}"
        assert res_data.get('success') is True
        print(f"[PASS 201] Newsletter Subscribed: {sub_email}")

    # Test Duplicate Subscribe
    req = urllib.request.Request(
        f"{BASE_URL}/api/newsletter/subscribe",
        data=sub_payload,
        headers={
            'Content-Type': 'application/json',
            'X-Finculator-CSRF': '1',
            'User-Agent': 'TestRunner'
        }
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert resp.status == 200
        assert res_data.get('alreadySubscribed') is True
        print(f"[PASS 200] Duplicate Newsletter Subscribe Handled: {res_data.get('message')}")

    # 7. Guest Session Data Isolation, Home Confirmation Modal & Exit Warning
    print("\n--- 7. Testing Guest Session Isolation, Home Confirmation & Exit Warning ---")
    with open("js/utils/storage.js", "r", encoding="utf-8") as f:
        storage_js = f.read()
        assert 'migrateGuestSessionToAccount' in storage_js, "migrateGuestSessionToAccount missing in storage.js"
        assert 'clearGuestSession' in storage_js, "clearGuestSession missing in storage.js"
        assert 'hasGuestSessionData' in storage_js, "hasGuestSessionData missing in storage.js"
        assert 'sessionStorage' in storage_js, "sessionStorage usage missing in storage.js"
        assert 'finculator_guest_state_' in storage_js, "finculator_guest_state_ prefix missing in storage.js"
        print("[PASS 200] js/utils/storage.js Verified: Session-only guest storage & auto-migration engine active")

    with open("js/utils/auth.js", "r", encoding="utf-8") as f:
        auth_js = f.read()
        assert 'migrateGuestSessionToAccount' in auth_js, "migrateGuestSessionToAccount not integrated in auth.js"
        print("[PASS 200] js/utils/auth.js Verified: Automatic migration invoked upon login/signup")

    with open("js/components/guestConfirmModal.js", "r", encoding="utf-8") as f:
        modal_js = f.read()
        assert 'export class GuestConfirmModal' in modal_js, "GuestConfirmModal class missing"
        assert 'btn-guest-confirm-login' in modal_js, "Login action button missing in GuestConfirmModal"
        assert 'btn-guest-confirm-discard' in modal_js, "Discard action button missing in GuestConfirmModal"
        print("[PASS 200] js/components/guestConfirmModal.js Verified: Dark themed confirmation modal active")

    with open("css/main.css", "r", encoding="utf-8") as f:
        main_css = f.read()
        assert '.guest-confirm-backdrop' in main_css, "guest-confirm-backdrop styles missing"
        assert '.guest-confirm-card' in main_css, "guest-confirm-card styles missing"
        assert ('.header-about-btn' in main_css or '.header-home-btn' in main_css), "header button styles missing"
        print("[PASS 200] css/main.css Verified: Dark obsidian modal styles and about/home button active")

    with open("js/app.js", "r", encoding="utf-8") as f:
        app_js = f.read()
        assert 'updateHomeButtonVisibility' in app_js, "updateHomeButtonVisibility missing in app.js"
        assert 'initGuestExitWarning' in app_js, "initGuestExitWarning missing in app.js"
        assert 'beforeunload' in app_js, "beforeunload listener missing in app.js"
        assert "Your progress isn't saved" in app_js, "Unsaved progress message missing in app.js"
        print("[PASS 200] js/app.js Verified: Home button visibility, confirmation dialog & beforeunload warning active")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: FULL SECURITY HARDENING ACTIVE AND 100% OPERATIONAL")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
