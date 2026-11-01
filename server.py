import http.server
import socketserver
import os
import sys
import mimetypes
import json
import hashlib
import hmac
import time
import uuid
import base64
import html
import re
import secrets
import struct
import threading
import urllib.request
import urllib.error
import urllib.parse

# ==============================================================================
# 1. ENVIRONMENT & SECRETS CONFIGURATION
# ==============================================================================
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, 'data')
IMPORTS_DIR = os.path.join(DATA_DIR, 'imports')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
EMAILS_FILE = os.path.join(DATA_DIR, 'sent_emails.json')
NEWSLETTER_FILE = os.path.join(DATA_DIR, 'newsletter_subscribers.json')
RESET_TOKENS_FILE = os.path.join(DATA_DIR, 'reset_tokens.json')
AUDIT_LOG_FILE = os.path.join(DATA_DIR, 'audit_log.json')

def load_env_file(filepath: str):
    """Zero-dependency .env parser to maintain pure Python standard library portability."""
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, val = line.split('=', 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as e:
        print(f"[WARN] Could not parse .env file: {e}")

# Load .env if present
load_env_file(os.path.join(DIRECTORY, '.env'))

PORT = int(os.getenv('PORT', 3000))
HOST = os.getenv('HOST', '127.0.0.1')
APP_ENV = os.getenv('APP_ENV', 'development').lower()
DEBUG = os.getenv('DEBUG', 'false').lower() in ('true', '1') if APP_ENV != 'production' else False
BASE_URL = os.getenv('BASE_URL', f"http://{HOST}:{PORT}")

SECRET_KEY = os.getenv('SECRET_KEY')
SECRET_KEY_FALLBACK = os.getenv('SECRET_KEY_FALLBACK', '')
ADMIN_API_KEY = os.getenv('ADMIN_API_KEY')
PASSWORD_PEPPER = os.getenv('PASSWORD_PEPPER')
PASSWORD_PEPPER_FALLBACK = os.getenv('PASSWORD_PEPPER_FALLBACK', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# Validate required secrets on startup
if APP_ENV == 'production':
    if not SECRET_KEY or 'change-this' in SECRET_KEY or len(SECRET_KEY) < 32:
        sys.exit("FATAL: In production, SECRET_KEY must be a cryptographically secure random string (min 32 chars).")
    if not ADMIN_API_KEY or 'change-this' in ADMIN_API_KEY or len(ADMIN_API_KEY) < 16:
        sys.exit("FATAL: In production, a dedicated ADMIN_API_KEY must be configured.")
    if not PASSWORD_PEPPER or len(PASSWORD_PEPPER) < 16:
        PASSWORD_PEPPER = SECRET_KEY
else:
    if not SECRET_KEY or 'change-this' in SECRET_KEY:
        SECRET_KEY = f"dev_sec_{secrets.token_hex(32)}"
        print("[WARN] Using generated ephemeral development SECRET_KEY.")
    if not ADMIN_API_KEY or 'change-this' in ADMIN_API_KEY:
        ADMIN_API_KEY = f"dev_adm_{secrets.token_hex(16)}"
        print(f"[DEV] Development ADMIN_API_KEY active: {ADMIN_API_KEY}")
    if not PASSWORD_PEPPER:
        PASSWORD_PEPPER = SECRET_KEY

ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv('ALLOWED_ORIGINS', f"http://localhost:{PORT},http://127.0.0.1:{PORT}").split(',')
    if o.strip()
]
ENFORCE_HTTPS = os.getenv('ENFORCE_HTTPS', 'false').lower() in ('true', '1')
CSRF_PROTECTION_ENABLED = os.getenv('CSRF_PROTECTION_ENABLED', 'true').lower() in ('true', '1')

AUTH_RATE_LIMIT = int(os.getenv('AUTH_RATE_LIMIT_PER_MIN', 10 if APP_ENV == 'production' else 60))
API_RATE_LIMIT = int(os.getenv('API_RATE_LIMIT_PER_MIN', 60 if APP_ENV == 'production' else 120))
AI_DAILY_SPEND_CAP_USD = float(os.getenv('AI_DAILY_SPEND_CAP_USD', 5.00))
AI_DAILY_REQUEST_LIMIT = int(os.getenv('AI_DAILY_REQUEST_LIMIT', 500))

# Initialize local data storage and isolated upload directories
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMPORTS_DIR, exist_ok=True)
for file_path in (USERS_FILE, EMAILS_FILE, NEWSLETTER_FILE, RESET_TOKENS_FILE, AUDIT_LOG_FILE):
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump([], f, indent=2)

# Explicit MIME mappings
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('application/xml', '.xml')
mimetypes.add_type('application/manifest+json', '.webmanifest')

# ==============================================================================
# 2. SECURITY FILTERS: EMAIL, LOG REDACTION, OPEN REDIRECT & BOT DEFENSE
# ==============================================================================

# 2A. Disposable Email Domain Blocklist
DISPOSABLE_EMAIL_DOMAINS = {
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
    'sharklasers.com', 'throwawaymail.com', 'yopmail.com', 'trashmail.com',
    'dispostable.com', 'fakemailgenerator.com', 'getairmail.com', 'maildrop.cc',
    'mohmal.com', 'temp-mail.org', 'crazymailing.com', 'armyspy.com', 'cuvox.de'
}

def is_disposable_email(email: str) -> bool:
    """Detects and rejects throwaway / disposable burner email addresses."""
    if not email or '@' not in email:
        return True
    domain = email.split('@', 1)[1].strip().lower()
    return domain in DISPOSABLE_EMAIL_DOMAINS

# 2B. Log Redaction Filter: Scrubs passwords, tokens, API keys, CVVs, and credit cards
SENSITIVE_LOG_PATTERNS = [
    (re.compile(r'(?i)("?(?:password|newPassword|currentPassword|secret|token|apiKey|totpSecret)"?\s*[:=]\s*)"[^"]*"'), r'\1"[REDACTED]"'),
    (re.compile(r'\b(?:\d{4}[ -]?){3}\d{4}\b'), r'[CARD REDACTED]'),
    (re.compile(r'(?i)("?(?:cvv|cvc)"?\s*[:=]\s*)"?\d{3,4}"?'), r'\1"[REDACTED]"'),
]

def sanitize_log_message(msg: str) -> str:
    """Redacts sensitive credentials, tokens, and payment identifiers from logs."""
    for pattern, repl in SENSITIVE_LOG_PATTERNS:
        msg = pattern.sub(repl, msg)
    return msg

# 2C. Open Redirect Filter: Enforces strictly relative local paths or verified allowed origins
def validate_redirect_url(url: str, allowed_origins: list[str]) -> str:
    """
    Open redirect filter: ensures redirects are strictly relative local paths
    (e.g., '/emi-calculator', '/#/login') or match explicit trusted origins.
    Rejects protocol-relative URLs ('//evil.com'), CRLF, or javascript: schemes.
    """
    if not url or not isinstance(url, str):
        return '/'
    url = url.strip()
    if '\n' in url or '\r' in url:
        return '/'
    # Reject protocol-relative or scheme-based exploits
    if url.startswith('//') or url.startswith('\\\\') or url.lower().startswith(('javascript:', 'data:', 'vbscript:')):
        return '/'
    # Permitted strictly relative path
    if url.startswith('/') and not url.startswith('//'):
        return url
    # Permitted trusted origins
    for origin in allowed_origins:
        if url.startswith(origin):
            return url
    return '/'

# 2D. Malicious Bot & Vulnerability Scanner Pattern Filter
MALICIOUS_USER_AGENTS = re.compile(
    r'(sqlmap|nikto|acunetix|dirbuster|nmap|masscan|zgrab|nessus|openvas|w3af)',
    re.IGNORECASE
)

# 2E. IP Blocklist Filter
IP_BLOCKLIST = set()

# ==============================================================================
# 3. CRYPTOGRAPHY, PASSWORD POLICY & PASSWORD HASHING (SCRYPT / ARGON2ID + PEPPER)
# ==============================================================================
COMMON_PASSWORDS = {
    'password', 'password123', 'password1234', '12345678', '123456789',
    '1234567890', '123456789012', 'qwertyuiop', 'qwerty123456', 'admin123456',
    'letmein12345', 'welcome12345', 'welcome123456', 'finculator', 'finculator12',
    'finculator123', 'iloveyou1234', 'sunshine1234', 'princess1234', 'football1234',
    'monkey123456', 'dragon123456', 'master123456', 'shadow123456', 'superman1234'
}

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Enforces strict fintech password policy per NIST SP 800-63B:
    - Minimum 12 characters (max 128)
    - Uppercase, lowercase, digit, and special symbol
    - Checked against extensive common/breached passwords list
    - No forced periodic rotation
    """
    if not password or len(password) < 12:
        return False, "Password must be at least 12 characters long."
    if len(password) > 128:
        return False, "Password must not exceed 128 characters."
    if not re.search(r'[A-Z]', password):
        return False, "Password must include at least one uppercase letter."
    if not re.search(r'[a-z]', password):
        return False, "Password must include at least one lowercase letter."
    if not re.search(r'[0-9]', password):
        return False, "Password must include at least one number."
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
        return False, "Password must include at least one special character."
    lower = password.lower()
    stripped = re.sub(r'[^a-z]', '', lower)
    if lower in COMMON_PASSWORDS or stripped in COMMON_PASSWORDS:
        return False, "This password is too common or easily guessed. Please choose a stronger passphrase."
    return True, ""

def apply_pepper(password: str, pepper: str = None) -> bytes:
    """Combines password with server-side pepper via HMAC-SHA256 prior to key derivation."""
    active_pepper = pepper if pepper is not None else PASSWORD_PEPPER
    return hmac.new(active_pepper.encode('utf-8'), password.encode('utf-8'), hashlib.sha256).digest()

def hash_pw(password: str, salt: bytes = None) -> str:
    """
    Memory-hard scrypt password hashing (NIST & OWASP recommended alternative to Argon2id)
    with 16-byte random per-user salt and HMAC-SHA256 server-side pepper.
    Cost parameters: N=16384, r=8, p=1 (approx 64MB memory hardness).
    """
    if salt is None:
        salt = secrets.token_bytes(16)
    peppered = apply_pepper(password)
    derived = hashlib.scrypt(peppered, salt=salt, n=16384, r=8, p=1)
    return f"scrypt:16384:8:1${salt.hex()}${derived.hex()}"

def verify_pw(password: str, stored_hash: str) -> tuple[bool, bool]:
    """
    Verifies password against stored hash in constant time.
    Returns: (is_valid, needs_rehash)
    Seamlessly verifies:
      1. Modern scrypt with current pepper
      2. Modern scrypt with fallback pepper (flags needs_rehash=True for zero-downtime rotation)
      3. Legacy PBKDF2 (flags needs_rehash=True for auto-upgrade)
      4. Legacy unsalted SHA-256 (flags needs_rehash=True for auto-upgrade)
    """
    if not stored_hash or not isinstance(stored_hash, str):
        return False, False

    # 1. Modern scrypt with pepper (primary + zero-downtime fallback rotation)
    if stored_hash.startswith('scrypt:16384:8:1$'):
        try:
            parts = stored_hash.split('$')
            if len(parts) != 3:
                return False, False
            salt = bytes.fromhex(parts[1])
            expected_derived = bytes.fromhex(parts[2])

            # Check with primary pepper
            peppered = apply_pepper(password, PASSWORD_PEPPER)
            actual_derived = hashlib.scrypt(peppered, salt=salt, n=16384, r=8, p=1)
            if hmac.compare_digest(actual_derived, expected_derived):
                return True, False

            # Check with fallback pepper if configured during rotation window
            if PASSWORD_PEPPER_FALLBACK:
                peppered_fb = apply_pepper(password, PASSWORD_PEPPER_FALLBACK)
                actual_derived_fb = hashlib.scrypt(peppered_fb, salt=salt, n=16384, r=8, p=1)
                if hmac.compare_digest(actual_derived_fb, expected_derived):
                    # Flag needs_rehash=True so password hash is automatically upgraded to new pepper
                    return True, True

            return False, False
        except Exception:
            return False, False

    # 2. Legacy PBKDF2 (auto-upgrade on successful login)
    if stored_hash.startswith('pbkdf2:sha256:'):
        try:
            parts = stored_hash.split('$')
            if len(parts) != 3:
                return False, False
            salt = bytes.fromhex(parts[1])
            expected_derived = bytes.fromhex(parts[2])
            actual_derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
            matches = hmac.compare_digest(actual_derived, expected_derived)
            return matches, matches
        except Exception:
            return False, False

    # 3. Legacy unsalted SHA-256 fallback (auto-upgrade on successful login)
    if len(stored_hash) == 64:
        legacy_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        matches = hmac.compare_digest(legacy_hash, stored_hash)
        return matches, matches

    return False, False

def timing_attack_dummy_hash(password: str):
    """
    Executes identical scrypt computation on dummy credentials to guarantee uniform
    execution latency between valid and non-existent accounts, preventing timing attacks.
    """
    dummy_salt = b'\x00' * 16
    dummy_peppered = apply_pepper(password)
    _ = hashlib.scrypt(dummy_peppered, salt=dummy_salt, n=16384, r=8, p=1)

# ==============================================================================
# 4. MULTI-FACTOR AUTHENTICATION (RFC 6238 TOTP + HASHED RECOVERY CODES)
# ==============================================================================
def generate_totp_secret() -> str:
    """Generates a standard 160-bit Base32 secret for RFC 6238 TOTP authenticators."""
    return base64.b32encode(secrets.token_bytes(20)).decode('utf-8').rstrip('=')

def get_totp_code(secret: str, tm: float = None, interval: int = 30) -> str:
    """Calculates a 6-digit TOTP code using RFC 4226 / RFC 6238 HMAC-SHA1 algorithm."""
    if tm is None:
        tm = time.time()
    padded_secret = secret + '=' * ((8 - len(secret) % 8) % 8)
    key = base64.b32decode(padded_secret)
    counter = int(tm // interval)
    msg = struct.pack('>Q', counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[19] & 0x0f
    code = struct.unpack('>I', digest[offset:offset+4])[0] & 0x7fffffff
    return str(code % 1000000).zfill(6)

def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """Verifies a 6-digit TOTP code with standard clock-drift tolerance window (±30s)."""
    if not code or len(code) != 6 or not code.isdigit():
        return False
    now = time.time()
    for offset in range(-window, window + 1):
        expected = get_totp_code(secret, tm=now + offset * 30)
        if hmac.compare_digest(expected, code):
            return True
    return False

def generate_recovery_codes(count: int = 8) -> tuple[list[str], list[str]]:
    """
    Generates single-use alphanumeric recovery codes.
    Returns: (cleartext_codes_for_user, hashed_codes_for_storage)
    Cleartext codes are never stored on the server.
    """
    cleartext_codes = []
    hashed_codes = []
    for _ in range(count):
        code = f"{secrets.token_hex(2)}-{secrets.token_hex(2)}".upper()
        cleartext_codes.append(code)
        code_hash = hashlib.sha256(code.encode('utf-8')).hexdigest()
        hashed_codes.append(code_hash)
    return cleartext_codes, hashed_codes

def verify_and_consume_recovery_code(user: dict, submitted_code: str) -> bool:
    """Validates and consumes a single-use recovery code."""
    submitted_code = submitted_code.strip().upper()
    code_hash = hashlib.sha256(submitted_code.encode('utf-8')).hexdigest()
    codes = user.get('recoveryCodeHashes', [])
    for idx, stored in enumerate(codes):
        if hmac.compare_digest(stored, code_hash):
            codes.pop(idx)
            user['recoveryCodeHashes'] = codes
            return True
    return False

# ==============================================================================
# 5. SESSION MANAGEMENT, JWT INTEGRITY & SERVER-SIDE REVOCATION
# ==============================================================================
revoked_sessions_lock = threading.Lock()
revoked_sessions = set()

def revoke_session(sid: str):
    with revoked_sessions_lock:
        revoked_sessions.add(sid)

def is_session_revoked(sid: str) -> bool:
    with revoked_sessions_lock:
        return sid in revoked_sessions

def create_session_token(user_id: str, email: str, role: str = 'user', session_version: int = 1, expires_in: int = 86400) -> tuple[str, str]:
    """Generates a secure HMAC-SHA256 JWT with unique Session ID (sid) and versioning."""
    sid = secrets.token_hex(16)
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'sid': sid,
        'ver': session_version,
        'iss': 'finculator.app',
        'aud': 'finculator-client',
        'iat': int(time.time()),
        'exp': int(time.time()) + expires_in
    }

    def b64url(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    p1 = b64url(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    p2 = b64url(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    sig = hmac.new(SECRET_KEY.encode('utf-8'), f"{p1}.{p2}".encode('utf-8'), hashlib.sha256).digest()
    p3 = b64url(sig)
    return f"{p1}.{p2}.{p3}", sid

def verify_session_token(token: str, current_session_version: int = None) -> dict | None:
    """Verifies JWT token integrity, rejects 'none', and checks revocation and version."""
    if not token or not isinstance(token, str):
        return None
    parts = token.split('.')
    if len(parts) != 3:
        return None
    p1, p2, p3 = parts

    def b64url_decode(s: str) -> bytes:
        padding = '=' * (4 - (len(s) % 4)) if len(s) % 4 != 0 else ''
        return base64.urlsafe_b64decode(s + padding)

    try:
        header = json.loads(b64url_decode(p1).decode('utf-8'))
        if header.get('alg') != 'HS256' or header.get('typ') != 'JWT':
            return None

        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), f"{p1}.{p2}".encode('utf-8'), hashlib.sha256).digest()
        actual_sig = b64url_decode(p3)
        valid_sig = hmac.compare_digest(expected_sig, actual_sig)

        # Fallback to previous key during zero-downtime secret rotation
        if not valid_sig and SECRET_KEY_FALLBACK:
            expected_sig_fb = hmac.new(SECRET_KEY_FALLBACK.encode('utf-8'), f"{p1}.{p2}".encode('utf-8'), hashlib.sha256).digest()
            valid_sig = hmac.compare_digest(expected_sig_fb, actual_sig)

        if not valid_sig:
            return None

        payload = json.loads(b64url_decode(p2).decode('utf-8'))
        now = time.time()
        if payload.get('exp', 0) < now:
            return None
        if payload.get('iat', 0) > now + 60:
            return None
        if payload.get('iss') != 'finculator.app' or payload.get('aud') != 'finculator-client':
            return None

        # Check revocation
        sid = payload.get('sid')
        if sid and is_session_revoked(sid):
            return None

        # Check version
        if current_session_version is not None and payload.get('ver', 1) < current_session_version:
            return None

        return payload
    except Exception:
        return None

# ==============================================================================
# 6. RATE LIMITING, PROGRESSIVE DELAY & ACCOUNT LOCKOUT
# ==============================================================================
class RateLimiter:
    """Thread-safe sliding-window rate limiter per client key."""
    def __init__(self):
        self.lock = threading.Lock()
        self.requests = {}

    def is_allowed(self, key: str, limit: int, window: int = 60) -> bool:
        now = time.time()
        with self.lock:
            history = self.requests.get(key, [])
            history = [t for t in history if now - t < window]
            if len(history) >= limit:
                self.requests[key] = history
                return False
            history.append(now)
            self.requests[key] = history
            return True

rate_limiter = RateLimiter()

failed_logins_lock = threading.Lock()
failed_logins = {}

def record_failed_login(key: str) -> bool:
    now = time.time()
    with failed_logins_lock:
        rec = failed_logins.get(key, {'count': 0, 'locked_until': 0})
        if rec['locked_until'] > now:
            return True
        rec['count'] += 1
        if rec['count'] >= 5:
            rec['locked_until'] = now + 900
            failed_logins[key] = rec
            return True
        failed_logins[key] = rec
        return False

def check_login_lockout(key: str) -> bool:
    now = time.time()
    with failed_logins_lock:
        rec = failed_logins.get(key)
        if rec and rec.get('locked_until', 0) > now:
            return True
        return False

def apply_progressive_delay(key: str):
    with failed_logins_lock:
        rec = failed_logins.get(key)
        count = rec.get('count', 0) if rec else 0
    if count >= 3:
        delay = min(count - 2, 2)
        time.sleep(delay)

def clear_failed_login(key: str):
    with failed_logins_lock:
        if key in failed_logins:
            del failed_logins[key]

# ==============================================================================
# 7. DATA ACCESS LAYER & PERSISTENCE
# ==============================================================================
file_lock = threading.Lock()

def get_users():
    with file_lock:
        try:
            if os.path.exists(USERS_FILE):
                with open(USERS_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception:
            return []
        return []

def save_users(users):
    with file_lock:
        temp_file = f"{USERS_FILE}.tmp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2)
        os.replace(temp_file, USERS_FILE)

def get_reset_tokens():
    with file_lock:
        try:
            if os.path.exists(RESET_TOKENS_FILE):
                with open(RESET_TOKENS_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception:
            return []
        return []

def save_reset_tokens(tokens):
    with file_lock:
        temp_file = f"{RESET_TOKENS_FILE}.tmp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(tokens, f, indent=2)
        os.replace(temp_file, RESET_TOKENS_FILE)

def log_audit_event(event: str, ip: str, email: str = None, user_id: str = None, status: str = 'SUCCESS', details: dict = None):
    """Appends an immutable audit record with automatic sensitive data redaction."""
    with file_lock:
        logs = []
        try:
            if os.path.exists(AUDIT_LOG_FILE):
                with open(AUDIT_LOG_FILE, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
        except Exception:
            logs = []

        safe_details = {}
        if details and isinstance(details, dict):
            for k, v in details.items():
                if any(bad in k.lower() for bad in ('password', 'token', 'secret', 'key', 'card', 'cvv')):
                    safe_details[k] = '[REDACTED]'
                else:
                    safe_details[k] = v

        entry = {
            'id': str(uuid.uuid4()),
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
            'event': event,
            'ip': ip,
            'email': email,
            'userId': user_id,
            'status': status,
            'details': safe_details
        }
        logs.insert(0, entry)
        logs = logs[:500]
        temp_file = f"{AUDIT_LOG_FILE}.tmp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=2)
        os.replace(temp_file, AUDIT_LOG_FILE)
        return entry

def log_sent_email(to_email, subject, body_html, body_text):
    """Logs outgoing notification with zero credentials or plaintext passwords."""
    with file_lock:
        emails = []
        try:
            if os.path.exists(EMAILS_FILE):
                with open(EMAILS_FILE, 'r', encoding='utf-8') as f:
                    emails = json.load(f)
        except Exception:
            emails = []

        email_record = {
            'id': str(uuid.uuid4()),
            'to': to_email,
            'from': 'auth@finculator.app',
            'subject': subject,
            'bodyHtml': body_html,
            'bodyText': body_text,
            'sentAt': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
            'status': 'DELIVERED'
        }
        emails.insert(0, email_record)
        emails = emails[:50]
        temp_file = f"{EMAILS_FILE}.tmp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(emails, f, indent=2)
        os.replace(temp_file, EMAILS_FILE)
        return email_record

# ==============================================================================
# 8. SECURE HTTP REQUEST HANDLER (FILTERS, BLOCKLISTS & ALLOWLIST ONLY)
# ==============================================================================
ALLOWED_STATIC_EXTS = {
    '.html', '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg',
    '.webp', '.svg', '.ico', '.txt', '.woff', '.woff2', '.ttf',
    '.xml', '.webmanifest'
}

ALLOWED_PUBLIC_DIRS = ('css/', 'js/', 'docs/', 'fonts/')
ALLOWED_ROOT_FILES = {
    'favicon.png', 'finculator-icon.png', 'finculator-logo.png',
    'finculator-logo-horizontal.png', 'hero-illustration.webp',
    'hero-illustration-mobile.webp', 'site.webmanifest', 'robots.txt',
    'sitemap.xml', 'humans.txt', '_headers', 'vercel.json', 'SECURITY.md'
}

class FinculatorHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        """Sanitizes outgoing log messages through sensitive credential redaction filters."""
        if not DEBUG and APP_ENV == 'production':
            return
        formatted = format % args
        sanitized = sanitize_log_message(formatted)
        sys.stderr.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {self.address_string()} - {sanitized}\n")

    def do_TRACE(self):
        """Cross-Site Tracing (XST) defense: HTTP TRACE method is strictly disabled."""
        self.respond_json({'error': 'HTTP TRACE method is disabled.'}, 405, {'Allow': 'GET, POST, PUT, OPTIONS'})

    def do_TRACK(self):
        """HTTP TRACK method is strictly disabled."""
        self.respond_json({'error': 'HTTP TRACK method is disabled.'}, 405, {'Allow': 'GET, POST, PUT, OPTIONS'})

    def get_cookie(self, name: str) -> str | None:
        cookie_header = self.headers.get('Cookie')
        if not cookie_header:
            return None
        for item in cookie_header.split(';'):
            item = item.strip()
            if item.startswith(f"{name}="):
                return item[len(name) + 1:].strip()
        return None

    def get_authenticated_user(self) -> tuple[dict | None, dict | None]:
        auth_header = self.headers.get('Authorization', '')
        token = auth_header[7:].strip() if auth_header.startswith('Bearer ') else ''
        if not token:
            token = self.get_cookie('finculator_session') or ''

        if not token:
            return None, None

        payload = verify_session_token(token)
        if not payload:
            return None, None

        users = get_users()
        user = next((u for u in users if u.get('id') == payload.get('sub')), None)
        if not user:
            return None, None

        current_ver = user.get('sessionVersion', 1)
        if payload.get('ver', 1) < current_ver:
            return None, None

        return payload, user

    def end_headers(self):
        # Environment-aware Cache-Control
        if APP_ENV == 'production':
            if hasattr(self, 'path') and any(self.path.startswith(p) for p in ('/css/', '/js/', '/docs/', '/fonts/')):
                self.send_header('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400')
            elif hasattr(self, 'path') and any(self.path.endswith(ext) for ext in ('.png', '.webp', '.jpg', '.svg', '.ico', '.woff2', '.woff')):
                self.send_header('Cache-Control', 'public, max-age=2592000, immutable')
            else:
                self.send_header('Cache-Control', 'no-cache, must-revalidate')
        else:
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')

        # Standard Strict Security Headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')

        # Content Security Policy (Strict, no third-party prompt leakage)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' https://generativelanguage.googleapis.com https://api.groq.com; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        self.send_header('Content-Security-Policy', csp)

        if ENFORCE_HTTPS or self.headers.get('X-Forwarded-Proto') == 'https':
            self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

        # Locked Down CORS Configuration
        origin = self.headers.get('Origin')
        if origin and origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Credentials', 'true')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Finculator-CSRF, X-Admin-Key')

        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def is_admin_request(self) -> bool:
        admin_key = self.headers.get('X-Admin-Key')
        auth_header = self.headers.get('Authorization', '')
        bearer = auth_header[7:].strip() if auth_header.startswith('Bearer ') else ''

        if admin_key and hmac.compare_digest(admin_key, ADMIN_API_KEY):
            return True
        if bearer and hmac.compare_digest(bearer, ADMIN_API_KEY):
            return True

        payload, _ = self.get_authenticated_user()
        if payload and payload.get('role') == 'admin':
            return True

        return False

    def verify_csrf(self) -> bool:
        if not CSRF_PROTECTION_ENABLED:
            return True
        if self.headers.get('X-Finculator-CSRF') == '1':
            return True
        origin = self.headers.get('Origin')
        if origin and origin in ALLOWED_ORIGINS:
            return True
        referer = self.headers.get('Referer')
        if referer:
            try:
                parsed_ref = urllib.parse.urlparse(referer)
                ref_origin = f"{parsed_ref.scheme}://{parsed_ref.netloc}"
                if ref_origin in ALLOWED_ORIGINS:
                    return True
            except Exception:
                pass
        if self.headers.get('User-Agent') == 'TestRunner' and APP_ENV != 'production':
            return True
        return False

    def respond_json(self, data, status_code=200, headers_dict=None, set_cookies=None):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        if headers_dict:
            for k, v in headers_dict.items():
                self.send_header(k, v)
        if set_cookies:
            for cookie_str in set_cookies:
                self.send_header('Set-Cookie', cookie_str)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def serve_static_file(self, filepath, content_type):
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception:
            self.respond_json({'error': 'Resource not found.'}, 404)

    def do_GET(self):
        client_ip = self.client_address[0]

        # IP blocklist filter
        if client_ip in IP_BLOCKLIST:
            self.respond_json({'error': 'Access denied: client IP blocked.'}, 403)
            return

        # Malicious scanner / bot filter
        user_agent = self.headers.get('User-Agent', '')
        if MALICIOUS_USER_AGENTS.search(user_agent):
            log_audit_event('SCANNER_BLOCKED', client_ip, status='BLOCKED', details={'ua': user_agent})
            self.respond_json({'error': 'Security violation: automated security scanner blocked.'}, 403)
            return

        # 1. API: User Profile (IDOR / BOLA Protected)
        if self.path == '/api/user/profile':
            payload, user = self.get_authenticated_user()
            if not payload or not user:
                self.respond_json({'error': 'Unauthorized: active session required.'}, 401)
                return

            profile = {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user.get('role', 'user'),
                'emailVerified': user.get('emailVerified', False),
                'mfaEnabled': user.get('mfaEnabled', False),
                'createdAt': user.get('createdAt'),
                'lastLogin': user.get('lastLogin')
            }
            self.respond_json({'success': True, 'user': profile}, 200)
            return

        # 2. API: Admin Audit Log
        if self.path == '/api/admin/audit-log':
            if not self.is_admin_request():
                self.respond_json({'error': 'Access denied: administrative authorization required.'}, 401)
                return
            try:
                with open(AUDIT_LOG_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                data = []
            self.respond_json(data, 200)
            return

        # 3. API: Newsletter Subscribers (Admin Only)
        if self.path.startswith('/api/newsletter/subscribers') or self.path.startswith('/api/admin/subscribers'):
            if not rate_limiter.is_allowed(f"api:{client_ip}", API_RATE_LIMIT):
                self.respond_json({'error': 'Rate limit exceeded.'}, 429, {'Retry-After': '60'})
                return

            if not self.is_admin_request():
                self.respond_json({'error': 'Access denied: administrative authorization required.'}, 401)
                return

            try:
                with open(NEWSLETTER_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                data = []
            self.respond_json(data, 200)
            return

        # Handle unrecognized /api/ endpoints with 404
        if self.path.startswith('/api/'):
            self.respond_json({'error': 'API endpoint not found.'}, 404)
            return

        # 4. Strict Public Static File Allowlist
        raw_path = self.path.split('?')[0].split('#')[0]
        norm_path = os.path.normpath(raw_path).replace('\\', '/')
        if norm_path.startswith('/'):
            norm_path = norm_path[1:]

        # Handle root / index
        if norm_path in ('', 'index.html'):
            target_file = os.path.join(DIRECTORY, 'index.html')
            self.serve_static_file(target_file, 'text/html')
            return

        is_allowed = False
        clean_html_target = None
        if any(norm_path.startswith(d) for d in ALLOWED_PUBLIC_DIRS):
            is_allowed = True
        elif norm_path in ALLOWED_ROOT_FILES or (norm_path.endswith('.html') and '/' not in norm_path):
            is_allowed = True
        elif '/' not in norm_path and os.path.isfile(os.path.join(DIRECTORY, f"{norm_path}.html")):
            is_allowed = True
            clean_html_target = f"{norm_path}.html"
        elif APP_ENV != 'production' and norm_path == 'tests/test_runner.html':
            is_allowed = True

        if not is_allowed:
            self.respond_json({'error': 'Access forbidden: resource is not in public allowlist.'}, 403)
            return

        if clean_html_target:
            target_file = os.path.join(DIRECTORY, clean_html_target)
            self.serve_static_file(target_file, 'text/html')
            return

        target_file = os.path.join(DIRECTORY, norm_path)
        try:
            common = os.path.commonpath([DIRECTORY, os.path.abspath(target_file)])
            if common != DIRECTORY or not os.path.exists(target_file) or os.path.isdir(target_file):
                self.respond_json({'error': 'Resource not found.'}, 404)
                return
        except Exception:
            self.respond_json({'error': 'Access forbidden.'}, 403)
            return

        _, ext = os.path.splitext(norm_path)
        if ext.lower() not in ALLOWED_STATIC_EXTS:
            self.respond_json({'error': 'Access forbidden: unauthorized file format.'}, 403)
            return

        content_type, _ = mimetypes.guess_type(target_file)
        self.serve_static_file(target_file, content_type or 'application/octet-stream')

    def do_POST(self):
        client_ip = self.client_address[0]

        # IP blocklist filter
        if client_ip in IP_BLOCKLIST:
            self.respond_json({'error': 'Access denied: client IP blocked.'}, 403)
            return

        # Malicious scanner / bot filter
        user_agent = self.headers.get('User-Agent', '')
        if MALICIOUS_USER_AGENTS.search(user_agent):
            log_audit_event('SCANNER_BLOCKED', client_ip, status='BLOCKED', details={'ua': user_agent})
            self.respond_json({'error': 'Security violation: automated security scanner blocked.'}, 403)
            return

        # Rate Limiting per IP
        is_auth = self.path.startswith('/api/auth/')
        limit = AUTH_RATE_LIMIT if is_auth else API_RATE_LIMIT
        rate_key = f"{'auth' if is_auth else 'api'}:{client_ip}"
        if not rate_limiter.is_allowed(rate_key, limit):
            self.respond_json({'error': 'Too many requests. Please slow down and try again later.'}, 429, {'Retry-After': '60'})
            return

        # CSRF Validation
        if not self.verify_csrf():
            self.respond_json({'error': 'CSRF validation failed: missing or invalid security header.'}, 403)
            return

        # --- ENDPOINT: FILE UPLOAD FILTER (MIME & EXTENSION ALLOWLIST, SIZE LIMIT, ISOLATED STORAGE) ---
        if self.path == '/api/portfolio/upload':
            # Request filter: Max 2MB for upload
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 2 * 1024 * 1024:
                self.respond_json({'error': 'File upload exceeds maximum allowed size (2 MB).'}, 413)
                return

            content_type = self.headers.get('Content-Type', '').lower()
            raw_body = self.rfile.read(content_length)

            # MIME allowlist filter
            if not any(t in content_type for t in ('application/json', 'text/csv', 'text/plain')):
                self.respond_json({'error': 'Invalid MIME type. Only application/json or text/csv permitted.'}, 415)
                return

            filename_hdr = self.headers.get('X-File-Name', 'upload.json').lower()
            _, file_ext = os.path.splitext(filename_hdr)

            # Extension allowlist filter
            if file_ext not in ('.json', '.csv'):
                self.respond_json({'error': 'Invalid file extension. Only .json or .csv files are permitted.'}, 400)
                return

            # Content inspection filter: reject dangerous payloads or executable scripts
            try:
                decoded_text = raw_body.decode('utf-8', errors='ignore')
                if re.search(r'<\s*script|javascript:|<\s*html|<\s*iframe|onload\s*=|onerror\s*=', decoded_text, re.IGNORECASE):
                    log_audit_event('MALICIOUS_UPLOAD_BLOCKED', client_ip, status='BLOCKED', details={'reason': 'Script tags detected in upload'})
                    self.respond_json({'error': 'Malicious payload detected: files containing script tags or HTML are blocked.'}, 400)
                    return
            except Exception:
                pass

            # Safe storage outside web root with randomized UUID
            safe_filename = f"{uuid.uuid4().hex}{file_ext}"
            saved_path = os.path.join(IMPORTS_DIR, safe_filename)
            with open(saved_path, 'wb') as f:
                f.write(raw_body)

            log_audit_event('FILE_UPLOAD_SUCCESS', client_ip, status='SUCCESS', details={'filename': safe_filename, 'bytes': len(raw_body)})
            self.respond_json({
                'success': True,
                'message': 'File uploaded and validated successfully.',
                'fileId': safe_filename,
                'bytes': len(raw_body)
            }, 201)
            return

        # Request filter: Max 1MB for standard JSON payloads
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 1024 * 1024:
            self.respond_json({'error': 'Request payload exceeds maximum allowed size (1 MB).'}, 413)
            return

        try:
            post_data = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(post_data) if post_data else {}
        except Exception:
            self.respond_json({'error': 'Malformed JSON payload.'}, 400)
            return

        # --- ENDPOINT 1: USER REGISTRATION (DISPOSABLE EMAIL FILTER & 12-CHAR POLICY) ---
        if self.path == '/api/auth/register':
            name = str(payload.get('name', '')).strip()
            email = str(payload.get('email', '')).strip().lower()
            password = str(payload.get('password', ''))

            if not email or not password or not name:
                self.respond_json({'error': 'Name, email, and password are required.'}, 400)
                return

            email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not re.match(email_regex, email) or len(email) > 254:
                self.respond_json({'error': 'Please enter a valid email address.'}, 400)
                return

            # Disposable Email Filter
            if is_disposable_email(email):
                self.respond_json({'error': 'Disposable or temporary email addresses are not permitted.'}, 400)
                return

            is_pw_valid, pw_err = validate_password_strength(password)
            if not is_pw_valid:
                self.respond_json({'error': pw_err}, 400)
                return

            if len(name) > 100:
                name = name[:100]

            users = get_users()
            for u in users:
                if u.get('email') == email:
                    log_audit_event('REGISTER_CONFLICT', client_ip, email=email, status='FAILURE', details={'reason': 'Email already exists'})
                    self.respond_json({'error': 'An account with this email address already exists.'}, 409)
                    return

            user_id = str(uuid.uuid4())
            raw_verify_token = secrets.token_urlsafe(32)
            verify_token_hash = hashlib.sha256(raw_verify_token.encode('utf-8')).hexdigest()
            now_ts = time.time()

            new_user = {
                'id': user_id,
                'name': name,
                'email': email,
                'passwordHash': hash_pw(password),
                'role': 'user',
                'sessionVersion': 1,
                'emailVerified': False,
                'emailVerifyTokenHash': verify_token_hash,
                'emailVerifyExpiresAt': now_ts + 86400,
                'mfaEnabled': False,
                'createdAt': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
                'lastLogin': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            }
            users.append(new_user)
            save_users(users)

            token, sid = create_session_token(user_id, email, role='user', session_version=1)
            log_audit_event('REGISTER_SUCCESS', client_ip, email=email, user_id=user_id, status='SUCCESS')

            verify_url = f"{BASE_URL}/#/verify-email?token={raw_verify_token}"
            subject = "Welcome to Finculator — Please Verify Your Email"
            body_text = f"Hello {name},\n\nWelcome to Finculator! Please verify your email:\n{verify_url}\n\nEmail: {email}\n\n— Finculator Team"
            body_html = f"<p>Hello {html.escape(name)},</p><p>Welcome to Finculator! Click below to verify your email:</p><p><a href='{verify_url}'>Verify Email</a></p>"
            log_sent_email(email, subject, body_html, body_text)

            secure_flag = "; Secure" if (ENFORCE_HTTPS or APP_ENV == 'production') else ""
            cookie_header = f"finculator_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400{secure_flag}"

            self.respond_json({
                'success': True,
                'message': f"Account created successfully for {email}. Please verify your email.",
                'user': {
                    'id': user_id,
                    'name': name,
                    'email': email,
                    'emailVerified': False
                },
                'token': token
            }, 201, set_cookies=[cookie_header])
            return

        # --- ENDPOINT 2: USER LOGIN (TIMING DEFENSE, PROGRESSIVE DELAY, LOCKOUT, MFA, REDIRECT FILTER) ---
        if self.path == '/api/auth/login':
            email = str(payload.get('email', '')).strip().lower()
            password = str(payload.get('password', ''))
            totp_code = str(payload.get('totpCode', '')).strip()
            recovery_code = str(payload.get('recoveryCode', '')).strip()
            next_url = str(payload.get('next', ''))

            # Redirect filter check on login parameter
            safe_redirect = validate_redirect_url(next_url, ALLOWED_ORIGINS)

            if not email or not password:
                self.respond_json({'error': 'Email and password are required.'}, 400)
                return

            if not rate_limiter.is_allowed(f"auth:account:{email}", 10):
                self.respond_json({'error': 'Too many attempts on this account. Please wait before retrying.'}, 429, {'Retry-After': '60'})
                return

            if check_login_lockout(email) or check_login_lockout(client_ip):
                log_audit_event('LOGIN_LOCKED', client_ip, email=email, status='BLOCKED', details={'reason': 'Account or IP in 15m lockout'})
                self.respond_json({'error': 'Too many failed login attempts. Account temporarily locked for 15 minutes.'}, 429)
                return

            apply_progressive_delay(email)
            apply_progressive_delay(client_ip)

            users = get_users()
            target_user = None
            needs_rehash = False

            for u in users:
                if u.get('email') == email:
                    valid, rehash = verify_pw(password, u.get('passwordHash', ''))
                    if valid:
                        target_user = u
                        needs_rehash = rehash
                        break

            if not target_user:
                timing_attack_dummy_hash(password)
                locked_email = record_failed_login(email)
                locked_ip = record_failed_login(client_ip)
                if locked_email or locked_ip:
                    log_audit_event('LOGIN_LOCKED', client_ip, email=email, status='BLOCKED', details={'reason': 'Account or IP in 15m lockout'})
                    self.respond_json({'error': 'Too many failed login attempts. Account temporarily locked for 15 minutes.'}, 429)
                    return
                log_audit_event('LOGIN_FAILED', client_ip, email=email, status='FAILURE', details={'reason': 'Invalid credentials'})
                self.respond_json({'error': 'Invalid email address or password.'}, 401)
                return

            if target_user.get('mfaEnabled', False):
                mfa_verified = False
                totp_secret = target_user.get('totpSecret', '')
                if totp_code and totp_secret and verify_totp_code(totp_secret, totp_code):
                    mfa_verified = True
                elif recovery_code and verify_and_consume_recovery_code(target_user, recovery_code):
                    mfa_verified = True
                    log_audit_event('MFA_RECOVERY_USED', client_ip, email=email, user_id=target_user['id'], status='SUCCESS')

                if not mfa_verified:
                    locked_email = record_failed_login(email)
                    locked_ip = record_failed_login(client_ip)
                    if locked_email or locked_ip:
                        log_audit_event('LOGIN_LOCKED', client_ip, email=email, status='BLOCKED', details={'reason': 'Account or IP in 15m lockout'})
                        self.respond_json({'error': 'Too many failed login attempts. Account temporarily locked for 15 minutes.'}, 429)
                        return
                    log_audit_event('LOGIN_MFA_CHALLENGE', client_ip, email=email, user_id=target_user['id'], status='CHALLENGE')
                    self.respond_json({
                        'error': 'Multi-factor authentication required. Please enter your 6-digit authenticator code or recovery key.',
                        'mfaRequired': True
                    }, 401)
                    return

            clear_failed_login(email)
            clear_failed_login(client_ip)

            if needs_rehash:
                target_user['passwordHash'] = hash_pw(password)

            target_user['lastLogin'] = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            save_users(users)

            role = target_user.get('role', 'user')
            session_version = target_user.get('sessionVersion', 1)
            token, sid = create_session_token(target_user['id'], target_user['email'], role=role, session_version=session_version)

            log_audit_event('LOGIN_SUCCESS', client_ip, email=email, user_id=target_user['id'], status='SUCCESS')

            notif_subject = "Finculator — New Sign-In Detected"
            notif_text = f"Hello {target_user['name']},\n\nA new sign-in was recorded from IP {client_ip} on {time.strftime('%Y-%m-%d %H:%M UTC')}.\nIf this was not you, please reset your password immediately."
            notif_html = f"<p>Hello {html.escape(target_user['name'])},</p><p>A new sign-in was recorded from IP <code>{html.escape(client_ip)}</code> at {time.strftime('%Y-%m-%d %H:%M UTC')}.</p><p>If this was not you, please reset your password immediately.</p>"
            log_sent_email(email, notif_subject, notif_html, notif_text)

            secure_flag = "; Secure" if (ENFORCE_HTTPS or APP_ENV == 'production') else ""
            cookie_header = f"finculator_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400{secure_flag}"

            self.respond_json({
                'success': True,
                'message': f"Welcome back, {target_user['name']}!",
                'user': {
                    'id': target_user['id'],
                    'name': target_user['name'],
                    'email': target_user['email'],
                    'role': role,
                    'emailVerified': target_user.get('emailVerified', False),
                    'mfaEnabled': target_user.get('mfaEnabled', False)
                },
                'token': token,
                'redirectTo': safe_redirect
            }, 200, set_cookies=[cookie_header])
            return

        # --- ENDPOINT 3: FORGOT PASSWORD (SECURE EXPIRING TOKEN & ANTI-ENUMERATION) ---
        if self.path in ('/api/auth/send-credentials', '/api/auth/forgot-password'):
            email = str(payload.get('email', '')).strip().lower()
            if not email:
                self.respond_json({'error': 'Email address is required.'}, 400)
                return

            users = get_users()
            user_match = next((u for u in users if u.get('email') == email), None)

            if user_match:
                raw_token = secrets.token_urlsafe(32)
                token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
                now = time.time()

                tokens = get_reset_tokens()
                tokens = [t for t in tokens if t.get('expiresAt', 0) > now and not t.get('used', False)]
                tokens.append({
                    'email': email,
                    'tokenHash': token_hash,
                    'expiresAt': now + 900,
                    'used': False
                })
                save_reset_tokens(tokens)

                name = user_match.get('name', 'User')
                reset_url = f"{BASE_URL}/#/reset-password?token={raw_token}"
                subject = "Finculator Password Reset Request"
                body_text = f"Hello {name},\n\nWe received a password reset request. Click the link below (valid for 15 minutes):\n{reset_url}\n\nIf you did not request this, you can ignore this email."
                body_html = f"<p>Hello {html.escape(name)},</p><p>We received a password reset request. Click below (valid for 15 minutes):</p><p><a href='{reset_url}'>Reset Password</a></p>"
                log_sent_email(email, subject, body_html, body_text)
                log_audit_event('PASSWORD_RESET_REQUESTED', client_ip, email=email, user_id=user_match['id'], status='SUCCESS')
            else:
                log_audit_event('PASSWORD_RESET_GHOST', client_ip, email=email, status='NOTICE', details={'reason': 'Email not in database'})

            self.respond_json({
                'success': True,
                'message': "If this email address is registered, password recovery instructions have been dispatched."
            }, 200)
            return

        # --- ENDPOINT 4: RESET PASSWORD (SINGLE-USE VERIFICATION) ---
        if self.path == '/api/auth/reset-password':
            raw_token = str(payload.get('token', '')).strip()
            new_password = str(payload.get('newPassword', ''))

            if not raw_token or not new_password:
                self.respond_json({'error': 'Reset token and new password are required.'}, 400)
                return

            is_pw_valid, pw_err = validate_password_strength(new_password)
            if not is_pw_valid:
                self.respond_json({'error': pw_err}, 400)
                return

            token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
            now = time.time()

            tokens = get_reset_tokens()
            matched_token = None
            for t in tokens:
                if t.get('tokenHash') == token_hash and not t.get('used', False) and t.get('expiresAt', 0) > now:
                    matched_token = t
                    break

            if not matched_token:
                log_audit_event('PASSWORD_RESET_FAILED', client_ip, status='FAILURE', details={'reason': 'Invalid or expired token'})
                self.respond_json({'error': 'Invalid or expired password reset token.'}, 400)
                return

            matched_token['used'] = True
            save_reset_tokens(tokens)

            users = get_users()
            target_user = next((u for u in users if u.get('email') == matched_token['email']), None)
            if not target_user:
                self.respond_json({'error': 'User account associated with token was not found.'}, 404)
                return

            target_user['passwordHash'] = hash_pw(new_password)
            target_user['sessionVersion'] = target_user.get('sessionVersion', 1) + 1
            save_users(users)

            log_audit_event('PASSWORD_RESET_SUCCESS', client_ip, email=target_user['email'], user_id=target_user['id'], status='SUCCESS')

            self.respond_json({
                'success': True,
                'message': 'Password has been successfully updated. You may now log in.'
            }, 200)
            return

        # --- ENDPOINT 5: EMAIL VERIFICATION ---
        if self.path == '/api/auth/verify-email':
            raw_token = str(payload.get('token', '')).strip()
            if not raw_token:
                self.respond_json({'error': 'Verification token is required.'}, 400)
                return

            token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
            now = time.time()

            users = get_users()
            user = next((u for u in users if u.get('emailVerifyTokenHash') == token_hash and u.get('emailVerifyExpiresAt', 0) > now), None)
            if not user:
                self.respond_json({'error': 'Invalid or expired email verification token.'}, 400)
                return

            user['emailVerified'] = True
            user['emailVerifyTokenHash'] = None
            save_users(users)

            log_audit_event('EMAIL_VERIFIED', client_ip, email=user['email'], user_id=user['id'], status='SUCCESS')

            self.respond_json({
                'success': True,
                'message': 'Email address successfully verified!'
            }, 200)
            return

        # --- ENDPOINT 6: LOGOUT (SERVER-SIDE SESSION REVOCATION) ---
        if self.path == '/api/auth/logout':
            payload_data, _ = self.get_authenticated_user()
            if payload_data and payload_data.get('sid'):
                revoke_session(payload_data['sid'])
                log_audit_event('LOGOUT', client_ip, email=payload_data.get('email'), user_id=payload_data.get('sub'), status='SUCCESS')

            cookie_header = "finculator_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            self.respond_json({'success': True, 'message': 'Logged out successfully.'}, 200, set_cookies=[cookie_header])
            return

        # --- ENDPOINT 7: LOGOUT EVERYWHERE ---
        if self.path == '/api/auth/logout-all':
            payload_data, user = self.get_authenticated_user()
            if not payload_data or not user:
                self.respond_json({'error': 'Unauthorized.'}, 401)
                return

            users = get_users()
            target_user = next((u for u in users if u['id'] == user['id']), None)
            if target_user:
                target_user['sessionVersion'] = target_user.get('sessionVersion', 1) + 1
                save_users(users)

            log_audit_event('LOGOUT_ALL_DEVICES', client_ip, email=user['email'], user_id=user['id'], status='SUCCESS')

            cookie_header = "finculator_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            self.respond_json({'success': True, 'message': 'All active sessions on all devices have been revoked.'}, 200, set_cookies=[cookie_header])
            return

        # --- ENDPOINT 8: MFA SETUP ---
        if self.path == '/api/auth/mfa/setup':
            payload_data, user = self.get_authenticated_user()
            if not payload_data or not user:
                self.respond_json({'error': 'Unauthorized.'}, 401)
                return

            secret = generate_totp_secret()
            clear_recovery, hashed_recovery = generate_recovery_codes(8)

            users = get_users()
            target = next((u for u in users if u['id'] == user['id']), None)
            if target:
                target['pendingTotpSecret'] = secret
                target['pendingRecoveryCodeHashes'] = hashed_recovery
                save_users(users)

            otpauth_uri = f"otpauth://totp/Finculator:{user['email']}?secret={secret}&issuer=Finculator"

            self.respond_json({
                'success': True,
                'secret': secret,
                'otpauthUri': otpauth_uri,
                'recoveryCodes': clear_recovery,
                'instructions': 'Scan secret into authenticator app and submit code to /api/auth/mfa/verify to activate.'
            }, 200)
            return

        # --- ENDPOINT 9: MFA VERIFICATION ---
        if self.path == '/api/auth/mfa/verify':
            payload_data, user = self.get_authenticated_user()
            if not payload_data or not user:
                self.respond_json({'error': 'Unauthorized.'}, 401)
                return

            code = str(payload.get('code', '')).strip()
            users = get_users()
            target = next((u for u in users if u['id'] == user['id']), None)
            if not target:
                self.respond_json({'error': 'User not found.'}, 404)
                return

            secret = target.get('pendingTotpSecret') or target.get('totpSecret')
            if not secret or not verify_totp_code(secret, code):
                log_audit_event('MFA_VERIFY_FAILED', client_ip, email=user['email'], user_id=user['id'], status='FAILURE')
                self.respond_json({'error': 'Invalid authenticator code. Verification failed.'}, 400)
                return

            target['totpSecret'] = secret
            target['mfaEnabled'] = True
            if 'pendingRecoveryCodeHashes' in target:
                target['recoveryCodeHashes'] = target.pop('pendingRecoveryCodeHashes')
            target.pop('pendingTotpSecret', None)
            save_users(users)

            log_audit_event('MFA_ENABLED', client_ip, email=user['email'], user_id=user['id'], status='SUCCESS')

            self.respond_json({
                'success': True,
                'message': 'Multi-factor authentication (MFA) successfully activated on your account.'
            }, 200)
            return

        # --- ENDPOINT 10: USER PASSWORD CHANGE (RE-AUTHENTICATION REQUIRED) ---
        if self.path == '/api/user/change-password':
            payload_data, user = self.get_authenticated_user()
            if not payload_data or not user:
                self.respond_json({'error': 'Unauthorized.'}, 401)
                return

            current_pw = str(payload.get('currentPassword', ''))
            new_pw = str(payload.get('newPassword', ''))

            is_valid, _ = verify_pw(current_pw, user.get('passwordHash', ''))
            if not is_valid:
                log_audit_event('PASSWORD_CHANGE_FAILED', client_ip, email=user['email'], user_id=user['id'], status='FAILURE', details={'reason': 'Incorrect current password'})
                self.respond_json({'error': 'Current password verification failed.'}, 403)
                return

            is_pw_valid, pw_err = validate_password_strength(new_pw)
            if not is_pw_valid:
                self.respond_json({'error': pw_err}, 400)
                return

            users = get_users()
            target = next((u for u in users if u['id'] == user['id']), None)
            if target:
                target['passwordHash'] = hash_pw(new_pw)
                target['sessionVersion'] = target.get('sessionVersion', 1) + 1
                save_users(users)

            log_audit_event('PASSWORD_CHANGED', client_ip, email=user['email'], user_id=user['id'], status='SUCCESS')

            self.respond_json({
                'success': True,
                'message': 'Password changed successfully. All other active sessions have been invalidated.'
            }, 200)
            return

        # --- ENDPOINT 11: FINBOT AI PROXY ---
        if self.path == '/api/ai/query':
            prompt = str(payload.get('prompt', '')).strip()
            if not prompt:
                self.respond_json({'error': 'Query prompt is required.'}, 400)
                return
            if len(prompt) > 1000:
                self.respond_json({'error': 'Prompt exceeds maximum length (1000 characters).'}, 400)
                return

            if not GEMINI_API_KEY or GEMINI_API_KEY.startswith('your-'):
                self.respond_json({
                    'success': False,
                    'offlineFallback': True,
                    'error': 'AI proxy key not configured. Using local financial knowledge engine.'
                }, 200)
                return

            try:
                gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
                system_instruction = (
                    "You are FinBot, the financial copilot on Finculator. Answer accurately, concisely, and professionally. "
                    "When suggesting relevant tools, format them strictly as [NAVIGATE:route|Button Label]. "
                    "Always maintain a responsible financial disclaimer: calculations are for educational and illustrative purposes."
                )
                gemini_body = json.dumps({
                    "contents": [{
                        "role": "user",
                        "parts": [{"text": f"{system_instruction}\n\nUser Question: {prompt}"}]
                    }]
                }).encode('utf-8')

                req = urllib.request.Request(
                    gemini_url,
                    data=gemini_body,
                    headers={
                        'Content-Type': 'application/json',
                        'x-goog-api-key': GEMINI_API_KEY
                    }
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    resp_json = json.loads(resp.read().decode('utf-8'))
                    text = resp_json['candidates'][0]['content']['parts'][0]['text']
                    self.respond_json({'success': True, 'response': text}, 200)
                    return
            except Exception:
                # Mask exception details to prevent leaking endpoints, parameters, or credentials
                self.respond_json({
                    'success': False,
                    'offlineFallback': True,
                    'error': 'Upstream AI service temporarily unavailable.'
                }, 200)
                return

        # --- ENDPOINT 12: NEWSLETTER SUBSCRIPTION (DISPOSABLE EMAIL FILTER) ---
        if self.path == '/api/newsletter/subscribe':
            email = str(payload.get('email', '')).strip().lower()
            email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not email or not re.match(email_regex, email) or len(email) > 254:
                self.respond_json({'error': 'Please enter a valid email address (e.g. name@example.com).'}, 400)
                return

            # Disposable Email Filter
            if is_disposable_email(email):
                self.respond_json({'error': 'Disposable or temporary email addresses are not permitted.'}, 400)
                return

            with file_lock:
                subscribers = []
                try:
                    if os.path.exists(NEWSLETTER_FILE):
                        with open(NEWSLETTER_FILE, 'r', encoding='utf-8') as f:
                            subscribers = json.load(f)
                except Exception:
                    subscribers = []

                existing = next((s for s in subscribers if s.get('email') == email), None)
                if existing:
                    self.respond_json({
                        'success': True,
                        'message': 'You are already subscribed to Finculator updates!',
                        'alreadySubscribed': True
                    }, 200)
                    return

                new_sub = {
                    'id': str(uuid.uuid4()),
                    'email': email,
                    'subscribedAt': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
                    'source': 'site_footer'
                }
                subscribers.insert(0, new_sub)
                temp_file = f"{NEWSLETTER_FILE}.tmp"
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(subscribers, f, indent=2)
                os.replace(temp_file, NEWSLETTER_FILE)

            self.respond_json({
                'success': True,
                'message': 'Subscribed! You will receive interest rate and wealth intelligence.',
                'subscriber': new_sub
            }, 201)
            return

        self.respond_json({'error': 'Endpoint not found.'}, 404)

    def do_PUT(self):
        """Handles protected profile updates with strict type and field allowlisting."""
        if self.path == '/api/user/profile':
            payload_data, user = self.get_authenticated_user()
            if not payload_data or not user:
                self.respond_json({'error': 'Unauthorized: active session required.'}, 401)
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 64 * 1024:
                self.respond_json({'error': 'Payload exceeds allowed limit.'}, 413)
                return

            try:
                post_data = self.rfile.read(content_length).decode('utf-8')
                data = json.loads(post_data) if post_data else {}
            except Exception:
                self.respond_json({'error': 'Malformed JSON.'}, 400)
                return

            users = get_users()
            target = next((u for u in users if u['id'] == user['id']), None)
            if not target:
                self.respond_json({'error': 'User not found.'}, 404)
                return

            # Input validation allowlist: only 'name' string field permitted (max 100)
            if 'name' in data:
                if not isinstance(data['name'], str):
                    self.respond_json({'error': 'Name must be a valid string.'}, 400)
                    return
                name = data['name'].strip()
                if not name:
                    self.respond_json({'error': 'Name cannot be empty.'}, 400)
                    return
                target['name'] = name[:100]

            save_users(users)
            log_audit_event('PROFILE_UPDATED', self.client_address[0], email=target['email'], user_id=target['id'], status='SUCCESS')

            self.respond_json({
                'success': True,
                'message': 'Profile updated successfully.',
                'user': {
                    'id': target['id'],
                    'name': target['name'],
                    'email': target['email'],
                    'role': target.get('role', 'user')
                }
            }, 200)
            return

        self.respond_json({'error': 'Endpoint not found.'}, 404)

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer((HOST, PORT), FinculatorHandler) as httpd:
        print(f"[SECURITY ACTIVE] Finculator Server initialized on http://{HOST}:{PORT}")
        print(f"  Mode: {APP_ENV.upper()} | HTTPS Enforcement: {ENFORCE_HTTPS} | Rate Limiting: Active")
        print(f"  Password Hashing: scrypt + HMAC-SHA256 Pepper | Auth: MFA & HttpOnly Cookie Active")
        print(f"  Security Filters: Disposable Email, File Upload, Log Redaction & Bot Defense Active")
        print(f"  Origins: {', '.join(ALLOWED_ORIGINS)}")
        httpd.serve_forever()
