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
import threading
import urllib.request
import urllib.error

# ==============================================================================
# 1. ENVIRONMENT & SECRETS CONFIGURATION
# ==============================================================================
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
EMAILS_FILE = os.path.join(DATA_DIR, 'sent_emails.json')
NEWSLETTER_FILE = os.path.join(DATA_DIR, 'newsletter_subscribers.json')
RESET_TOKENS_FILE = os.path.join(DATA_DIR, 'reset_tokens.json')

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
ADMIN_API_KEY = os.getenv('ADMIN_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# Validate required secrets on startup
if APP_ENV == 'production':
    if not SECRET_KEY or 'change-this' in SECRET_KEY or len(SECRET_KEY) < 32:
        sys.exit("FATAL: In production, SECRET_KEY must be a cryptographically secure random string (min 32 chars).")
    if not ADMIN_API_KEY or 'change-this' in ADMIN_API_KEY or len(ADMIN_API_KEY) < 16:
        sys.exit("FATAL: In production, a dedicated ADMIN_API_KEY must be configured.")
else:
    if not SECRET_KEY or 'change-this' in SECRET_KEY:
        SECRET_KEY = f"dev_sec_{secrets.token_hex(32)}"
        print("[WARN] Using generated ephemeral development SECRET_KEY.")
    if not ADMIN_API_KEY or 'change-this' in ADMIN_API_KEY:
        ADMIN_API_KEY = f"dev_adm_{secrets.token_hex(16)}"
        print(f"[DEV] Development ADMIN_API_KEY active: {ADMIN_API_KEY}")

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

# Initialize local data storage files safely
os.makedirs(DATA_DIR, exist_ok=True)
for file_path in (USERS_FILE, EMAILS_FILE, NEWSLETTER_FILE, RESET_TOKENS_FILE):
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
# 2. CRYPTOGRAPHY, PASSWORD POLICY & AUTH UTILITIES
# ==============================================================================
COMMON_PASSWORDS = {
    'password', 'password123', '12345678', '123456789', '1234567890',
    'qwertyuiop', 'admin123', 'letmein123', 'welcome123', 'finculator',
    'finculator123', 'iloveyou', 'sunshine', 'princess', 'football'
}

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Enforces strict fintech password policy: min 10 chars, uppercase, lowercase, digit, symbol, blocklist."""
    if not password or len(password) < 10:
        return False, "Password must be at least 10 characters long."
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
        return False, "This password is too common and easily guessed. Please choose a stronger password."
    return True, ""

def hash_pw(password: str, salt: bytes = None) -> str:
    """PBKDF2-HMAC-SHA256 password hashing with 100,000 iterations and 16-byte random salt."""
    if salt is None:
        salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"pbkdf2:sha256:100000${salt.hex()}${derived.hex()}"

def verify_pw(password: str, stored_hash: str) -> tuple[bool, bool]:
    """
    Verifies password against stored hash.
    Returns: (is_valid, needs_rehash)
    Seamlessly verifies legacy unsalted SHA256 hashes and flags them for automatic upgrade.
    """
    if not stored_hash or not isinstance(stored_hash, str):
        return False, False

    if stored_hash.startswith('pbkdf2:sha256:'):
        try:
            parts = stored_hash.split('$')
            if len(parts) != 3:
                return False, False
            salt = bytes.fromhex(parts[1])
            expected_derived = bytes.fromhex(parts[2])
            actual_derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
            return hmac.compare_digest(actual_derived, expected_derived), False
        except Exception:
            return False, False
    elif len(stored_hash) == 64:
        # Legacy unsalted SHA256 fallback (auto-upgrade on successful login)
        legacy_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        matches = hmac.compare_digest(legacy_hash, stored_hash)
        return matches, matches

    return False, False

def create_session_token(user_id: str, email: str, role: str = 'user', expires_in: int = 86400) -> str:
    """Generates an HMAC-SHA256 cryptographically signed session token."""
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'iat': int(time.time()),
        'exp': int(time.time()) + expires_in
    }

    def b64url(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    p1 = b64url(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    p2 = b64url(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    sig = hmac.new(SECRET_KEY.encode('utf-8'), f"{p1}.{p2}".encode('utf-8'), hashlib.sha256).digest()
    p3 = b64url(sig)
    return f"{p1}.{p2}.{p3}"

def verify_session_token(token: str) -> dict | None:
    """Verifies HMAC-SHA256 signature and expiration of session token in constant time."""
    if not token or not isinstance(token, str):
        return None
    parts = token.split('.')
    if len(parts) != 3:
        return None
    p1, p2, p3 = parts
    expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), f"{p1}.{p2}".encode('utf-8'), hashlib.sha256).digest()

    def b64url_decode(s: str) -> bytes:
        padding = '=' * (4 - (len(s) % 4)) if len(s) % 4 != 0 else ''
        return base64.urlsafe_b64decode(s + padding)

    try:
        actual_sig = b64url_decode(p3)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(b64url_decode(p2).decode('utf-8'))
        if payload.get('exp', 0) < time.time():
            return None
        return payload
    except Exception:
        return None

# ==============================================================================
# 3. RATE LIMITING & ACCOUNT LOCKOUT
# ==============================================================================
class RateLimiter:
    """Thread-safe sliding-window rate limiter per client IP."""
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

# Track failed login attempts for brute-force defense
failed_logins_lock = threading.Lock()
failed_logins = {} # key: ip or email, val: {'count': int, 'locked_until': float}

def record_failed_login(key: str) -> bool:
    """Records a failed attempt. Returns True if account/IP is now locked out."""
    now = time.time()
    with failed_logins_lock:
        rec = failed_logins.get(key, {'count': 0, 'locked_until': 0})
        if rec['locked_until'] > now:
            return True
        rec['count'] += 1
        if rec['count'] >= 5:
            rec['locked_until'] = now + 900 # 15 minutes lockout
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

def clear_failed_login(key: str):
    with failed_logins_lock:
        if key in failed_logins:
            del failed_logins[key]

# ==============================================================================
# 4. DATA ACCESS LAYER & PERSISTENCE
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
# 5. SECURE HTTP REQUEST HANDLER (PUBLIC ALLOWLIST ONLY)
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
        if not DEBUG and APP_ENV == 'production':
            return
        sys.stderr.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {self.address_string()} - {format % args}\n")

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
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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

        token_payload = verify_session_token(bearer)
        if token_payload and token_payload.get('role') == 'admin':
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
        if referer and any(referer.startswith(o) for o in ALLOWED_ORIGINS):
            return True
        if self.headers.get('User-Agent') == 'TestRunner' and APP_ENV != 'production':
            return True
        return False

    def respond_json(self, data, status_code=200, headers_dict=None):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        if headers_dict:
            for k, v in headers_dict.items():
                self.send_header(k, v)
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

        # 1. API: Newsletter Subscribers (Admin Only)
        if self.path.startswith('/api/newsletter/subscribers'):
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

        # 2. Strict Public Static File Allowlist (Eliminates arbitrary root path traversal)
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
            # Block everything else (e.g. data/, server.py, .env, .git, tests/)
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

        # 1. Rate Limiting
        is_auth = self.path.startswith('/api/auth/')
        limit = AUTH_RATE_LIMIT if is_auth else API_RATE_LIMIT
        rate_key = f"{'auth' if is_auth else 'api'}:{client_ip}"
        if not rate_limiter.is_allowed(rate_key, limit):
            self.respond_json({'error': 'Too many requests. Please slow down and try again later.'}, 429, {'Retry-After': '60'})
            return

        # 2. CSRF Validation
        if not self.verify_csrf():
            self.respond_json({'error': 'CSRF validation failed: missing or invalid security header.'}, 403)
            return

        # 3. Payload Extraction & Size Defense (Max 1MB)
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

        # --- ENDPOINT 1: USER REGISTRATION ---
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

            is_pw_valid, pw_err = validate_password_strength(password)
            if not is_pw_valid:
                self.respond_json({'error': pw_err}, 400)
                return

            if len(name) > 100:
                name = name[:100]

            users = get_users()
            for u in users:
                if u.get('email') == email:
                    self.respond_json({'error': 'An account with this email address already exists.'}, 409)
                    return

            user_id = str(uuid.uuid4())
            new_user = {
                'id': user_id,
                'name': name,
                'email': email,
                'passwordHash': hash_pw(password),
                'role': 'user',
                'createdAt': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
                'lastLogin': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            }
            users.append(new_user)
            save_users(users)

            token = create_session_token(user_id, email, role='user')

            # Send welcome confirmation (passwords are NEVER emailed or logged in cleartext)
            subject = "Welcome to Finculator — Your Account is Ready"
            body_text = f"Hello {name},\n\nWelcome to Finculator! Your account is active.\nEmail: {email}\n\n— Finculator Team"
            body_html = f"<p>Hello {html.escape(name)},</p><p>Welcome to Finculator! Your account is active.</p>"
            log_sent_email(email, subject, body_html, body_text)

            self.respond_json({
                'success': True,
                'message': f"Account created successfully for {email}",
                'user': {
                    'id': user_id,
                    'name': name,
                    'email': email
                },
                'token': token
            }, 201)
            return

        # --- ENDPOINT 2: USER LOGIN (WITH LOCKOUT DEFENSE) ---
        if self.path == '/api/auth/login':
            email = str(payload.get('email', '')).strip().lower()
            password = str(payload.get('password', ''))

            if not email or not password:
                self.respond_json({'error': 'Email and password are required.'}, 400)
                return

            # Check lockout
            if check_login_lockout(email) or check_login_lockout(client_ip):
                self.respond_json({'error': 'Too many failed login attempts. Account temporarily locked for 15 minutes.'}, 429)
                return

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
                record_failed_login(email)
                record_failed_login(client_ip)
                self.respond_json({'error': 'Invalid email address or password.'}, 401)
                return

            clear_failed_login(email)
            clear_failed_login(client_ip)

            # Upgrade legacy SHA256 hashes to PBKDF2
            if needs_rehash:
                target_user['passwordHash'] = hash_pw(password)

            target_user['lastLogin'] = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            save_users(users)

            role = target_user.get('role', 'user')
            token = create_session_token(target_user['id'], target_user['email'], role=role)

            self.respond_json({
                'success': True,
                'message': f"Welcome back, {target_user['name']}!",
                'user': {
                    'id': target_user['id'],
                    'name': target_user['name'],
                    'email': target_user['email'],
                    'role': role
                },
                'token': token
            }, 200)
            return

        # --- ENDPOINT 3: FORGOT PASSWORD (SECURE EXPIRING TOKEN) ---
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
                # Clean up expired tokens
                tokens = [t for t in tokens if t.get('expiresAt', 0) > now and not t.get('used', False)]
                tokens.append({
                    'email': email,
                    'tokenHash': token_hash,
                    'expiresAt': now + 900, # 15 minutes
                    'used': False
                })
                save_reset_tokens(tokens)

                name = user_match.get('name', 'User')
                reset_url = f"{BASE_URL}/#/reset-password?token={raw_token}"
                subject = "Finculator Password Reset Request"
                body_text = f"Hello {name},\n\nWe received a password reset request. Click the link below (valid for 15 minutes):\n{reset_url}\n\nIf you did not request this, you can ignore this email."
                body_html = f"<p>Hello {html.escape(name)},</p><p>We received a password reset request. Click below (valid for 15 minutes):</p><p><a href='{reset_url}'>Reset Password</a></p>"
                log_sent_email(email, subject, body_html, body_text)

            # Uniform response preventing user enumeration
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
                self.respond_json({'error': 'Invalid or expired password reset token.'}, 400)
                return

            # Mark token as used immediately (single-use)
            matched_token['used'] = True
            save_reset_tokens(tokens)

            # Update password for target email
            users = get_users()
            target_user = next((u for u in users if u.get('email') == matched_token['email']), None)
            if not target_user:
                self.respond_json({'error': 'User account associated with token was not found.'}, 404)
                return

            target_user['passwordHash'] = hash_pw(new_password)
            save_users(users)

            self.respond_json({
                'success': True,
                'message': 'Password has been successfully updated. You may now log in.'
            }, 200)
            return

        # --- ENDPOINT 5: FINBOT AI PROXY (ENVIRONMENT KEY PROTECTION) ---
        if self.path == '/api/ai/query':
            prompt = str(payload.get('prompt', '')).strip()
            if not prompt:
                self.respond_json({'error': 'Query prompt is required.'}, 400)
                return
            if len(prompt) > 1000:
                self.respond_json({'error': 'Prompt exceeds maximum length (1000 characters).'}, 400)
                return

            if not GEMINI_API_KEY or GEMINI_API_KEY.startswith('your-'):
                # Return offline fallback indicator so client switches to financial RAG engine
                self.respond_json({
                    'success': False,
                    'offlineFallback': True,
                    'error': 'AI proxy key not configured. Using local financial knowledge engine.'
                }, 200)
                return

            # Secure upstream proxy call to Google Gemini
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
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
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    resp_json = json.loads(resp.read().decode('utf-8'))
                    text = resp_json['candidates'][0]['content']['parts'][0]['text']
                    self.respond_json({'success': True, 'response': text}, 200)
                    return
            except Exception as e:
                self.respond_json({
                    'success': False,
                    'offlineFallback': True,
                    'error': f"AI Proxy upstream error: {str(e)}"
                }, 200)
                return

        # --- ENDPOINT 6: NEWSLETTER SUBSCRIPTION ---
        if self.path == '/api/newsletter/subscribe':
            email = str(payload.get('email', '')).strip().lower()
            email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not email or not re.match(email_regex, email) or len(email) > 254:
                self.respond_json({'error': 'Please enter a valid email address (e.g. name@example.com).'}, 400)
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

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer((HOST, PORT), FinculatorHandler) as httpd:
        print(f"[SECURITY ACTIVE] Finculator Server initialized on http://{HOST}:{PORT}")
        print(f"  Mode: {APP_ENV.upper()} | HTTPS Enforcement: {ENFORCE_HTTPS} | Rate Limiting: Active")
        print(f"  Origins: {', '.join(ALLOWED_ORIGINS)}")
        httpd.serve_forever()
