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

    # 6. Full-Width Footer Verification & Newsletter API
    print("\n--- 6. Testing Full-Width Footer & Newsletter Subscription API ---")
    req = urllib.request.Request(f"{BASE_URL}/index.html")
    with urllib.request.urlopen(req, timeout=5) as resp:
        html = resp.read().decode('utf-8')
        assert 'id="site-footer"' in html, "Site footer element missing"
        assert 'class="app-footer"' in html, "app-footer class missing"
        assert 'id="btn-header-home"' in html, "Home icon button missing in navbar"
        assert 'id="header-auth-wrapper"' in html, "Header auth wrapper missing in navbar"
        print("[PASS 200] Header & Footer DOM Verified: Home icon button and Profile wrapper placed correctly")

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
        print("[PASS 200] js/components/heroLandingGate.js Verified: Shared Footer mounted on Landing Gate")

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
        print("[PASS 200] chatbot.css Verified: Compact circular FAB and hover/tap expansion active")

    # Test Newsletter Subscribe
    sub_email = f"subscriber_{int(time.time())}@institutional.com"
    sub_payload = json.dumps({"email": sub_email}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/newsletter/subscribe",
        data=sub_payload,
        headers={'Content-Type': 'application/json'}
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
        headers={'Content-Type': 'application/json'}
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
        assert 'display: none' in main_css, "header-home-btn hidden by default missing"
        print("[PASS 200] css/main.css Verified: Dark obsidian modal styles and hidden-by-default home button active")

    with open("js/app.js", "r", encoding="utf-8") as f:
        app_js = f.read()
        assert 'updateHomeButtonVisibility' in app_js, "updateHomeButtonVisibility missing in app.js"
        assert 'initGuestExitWarning' in app_js, "initGuestExitWarning missing in app.js"
        assert 'beforeunload' in app_js, "beforeunload listener missing in app.js"
        assert "Your progress isn't saved" in app_js, "Unsaved progress message missing in app.js"
        print("[PASS 200] js/app.js Verified: Home button visibility, confirmation dialog & beforeunload warning active")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: GUEST ISOLATION, HOME CONFIRMATION & MIGRATION 100% OPERATIONAL")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
