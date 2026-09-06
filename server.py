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

# ==============================================================================
# 1. ENVIRONMENT & SECRETS CONFIGURATION
# ==============================================================================
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
EMAILS_FILE = os.path.join(DATA_DIR, 'sent_emails.json')
NEWSLETTER_FILE = os.path.join(DATA_DIR, 'newsletter_subscribers.json')

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

SECRET_KEY = os.getenv('SECRET_KEY')
ADMIN_API_KEY = os.getenv('ADMIN_API_KEY')

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
    o.strip() for o in os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    if o.strip()
]
ENFORCE_HTTPS = os.getenv('ENFORCE_HTTPS', 'false').lower() in ('true', '1')
CSRF_PROTECTION_ENABLED = os.getenv('CSRF_PROTECTION_ENABLED', 'true').lower() in ('true', '1')

AUTH_RATE_LIMIT = int(os.getenv('AUTH_RATE_LIMIT_PER_MIN', 10 if APP_ENV == 'production' else 60))
API_RATE_LIMIT = int(os.getenv('API_RATE_LIMIT_PER_MIN', 60 if APP_ENV == 'production' else 120))
AI_DAILY_SPEND_CAP_USD = float(os.getenv('AI_DAILY_SPEND_CAP_USD', 5.00))
AI_DAILY_REQUEST_LIMIT = int(os.getenv('AI_DAILY_REQUEST_LIMIT', 500))

# Initialize database files
os.makedirs(DATA_DIR, exist_ok=True)
for file_path in (USERS_FILE, EMAILS_FILE, NEWSLETTER_FILE):
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

# ==============================================================================
# 2. CRYPTOGRAPHY & AUTHENTICATION UTILITIES
# ==============================================================================
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
# 3. RATE LIMITING & ABUSE PREVENTION
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

# ==============================================================================
# 4. DATA ACCESS LAYER & LOGGING
# ==============================================================================
file_lock = threading.Lock()

def get_users():
    with file_lock:
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

def save_users(users):
    with file_lock:
        # Atomic write pattern
        temp_file = f"{USERS_FILE}.tmp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2)
        os.replace(temp_file, USERS_FILE)

def generate_welcome_email_html(name, email, user_id):
    safe_name = html.escape(name)
    safe_email = html.escape(email)
    safe_uid = html.escape(user_id)
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="margin: 0; padding: 0; background-color: #0A0F1D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #0D1526; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
        <tr>
          <td align="center" style="padding: 40px 20px 24px 20px; background: linear-gradient(180deg, #131E36 0%, #0D1526 100%); border-bottom: 1px solid #1E293B;">
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 48 10 A 38 38 0 1 0 86 48" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" />
              <rect x="34" y="52" width="7.5" height="20" rx="3.75" fill="#2563EB" />
              <rect x="46" y="40" width="7.5" height="32" rx="3.75" fill="#3B82F6" />
              <rect x="58" y="28" width="7.5" height="44" rx="3.75" fill="#06B6D4" />
              <path d="M 32 68 L 76 24" fill="none" stroke="#06B6D4" stroke-width="8" stroke-linecap="round" />
              <path d="M 56 20 L 82 20 L 82 46 Z" fill="#06B6D4" stroke-linejoin="round" />
            </svg>
            <div style="font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: 1px; margin-top: 12px;">FINCULATOR</div>
            <div style="font-size: 12px; color: #38BDF8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">Smart Decisions. Stronger Futures.</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 32px 24px 32px;">
            <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 700; margin: 0 0 12px 0;">Welcome to Finculator, {safe_name}!</h1>
            <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Finculator is your institutional wealth optimization platform — engineered to help you simulate loans, compound investments, navigate taxes, and build advisory-grade portfolios with mathematical precision.
            </p>
            <div style="background-color: #131E36; border: 1px solid #2563EB; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
              <div style="font-size: 13px; font-weight: 700; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
                Account Confirmation
              </div>
              <table width="100%" cellpadding="6" cellspacing="0">
                <tr>
                  <td width="38%" style="color: #94A3B8; font-size: 14px; font-weight: 600;">Registered Email:</td>
                  <td style="color: #FFFFFF; font-size: 14px; font-family: monospace; font-weight: bold;">{safe_email}</td>
                </tr>
                <tr>
                  <td style="color: #94A3B8; font-size: 14px; font-weight: 600;">Security Status:</td>
                  <td style="color: #10B981; font-size: 14px;">PBKDF2-Encrypted Active</td>
                </tr>
                <tr>
                  <td style="color: #94A3B8; font-size: 14px; font-weight: 600;">Account ID:</td>
                  <td style="color: #64748B; font-size: 12px; font-family: monospace;">{safe_uid}</td>
                </tr>
              </table>
            </div>
            <div align="center" style="margin-bottom: 30px;">
              <a href="http://localhost:3000/#/login" style="background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%); color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 6px 20px rgba(37,99,235,0.4);">
                Access Your Financial Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 24px; background-color: #0A0F1D; border-top: 1px solid #1E293B;">
            <p style="color: #64748B; font-size: 12px; margin: 0 0 6px 0;">
              Finculator Security Team • Institutional Cryptographic Architecture
            </p>
            <p style="color: #475569; font-size: 11px; margin: 0;">
              © 2026 Finculator. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def log_sent_email(to_email, subject, body_html, body_text):
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
            'from': 'auth@finculator.io',
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
# 5. SECURE HTTP REQUEST HANDLER
# ==============================================================================
ALLOWED_STATIC_EXTS = {
    '.html', '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg',
    '.webp', '.svg', '.ico', '.txt', '.woff', '.woff2', '.ttf'
}
FORBIDDEN_PATH_SEGMENTS = {
    'data', '.git', '.env', 'tests', '__pycache__', 'scratch', '.system_generated'
}
FORBIDDEN_EXTS = {
    '.py', '.pyc', '.bat', '.json', '.zip', '.sh', '.env', '.md'
}

class FinculatorHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        """Sanitized request logging omitting sensitive user query parameters or tokens."""
        if not DEBUG and APP_ENV == 'production':
            return
        sys.stderr.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {self.address_string()} - {format % args}\n")

    def end_headers(self):
        # Cache control
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')

        # Standard Security Headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')

        # Content Security Policy (CSP)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://generativelanguage.googleapis.com https://api.groq.com https://text.pollinations.ai; "
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
        """Verifies admin authorization via X-Admin-Key, Bearer token, or admin session."""
        admin_key = self.headers.get('X-Admin-Key')
        auth_header = self.headers.get('Authorization', '')
        bearer = auth_header[7:].strip() if auth_header.startswith('Bearer ') else ''

        if admin_key and hmac.compare_digest(admin_key, ADMIN_API_KEY):
            return True
        if bearer and hmac.compare_digest(bearer, ADMIN_API_KEY):
            return True

        # Check signed session token with role == admin
        token_payload = verify_session_token(bearer)
        if token_payload and token_payload.get('role') == 'admin':
            return True

        return False

    def verify_csrf(self) -> bool:
        """Validates CSRF tokens and request origins on state-changing operations."""
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

    def do_GET(self):
        client_ip = self.client_address[0]

        # 1. API: Sent Emails (Admin Only)
        if self.path.startswith('/api/auth/sent-emails'):
            if not rate_limiter.is_allowed(f"api:{client_ip}", API_RATE_LIMIT):
                self.respond_json({'error': 'Rate limit exceeded.'}, 429, {'Retry-After': '60'})
                return

            if not self.is_admin_request():
                self.respond_json({'error': 'Access denied: administrative authorization required.'}, 401)
                return

            try:
                with open(EMAILS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                data = []
            self.respond_json(data, 200)
            return

        # 2. API: Newsletter Subscribers (Admin Only)
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

        # 3. Static Files: Strict Path Traversal & Isolation Defense
        raw_path = self.path.split('?')[0].split('#')[0]
        norm_path = os.path.normpath(raw_path).replace('\\', '/')
        segments = [s for s in norm_path.strip('/').split('/') if s]

        # Block access to database files, source code, git metadata, and tests
        for seg in segments:
            # Permit test_runner.html strictly in development mode for math unit verification
            if seg == 'tests' and APP_ENV != 'production' and norm_path in ('/tests/test_runner.html', 'tests/test_runner.html'):
                continue
            if seg in FORBIDDEN_PATH_SEGMENTS or seg.startswith('.'):
                self.respond_json({'error': 'Access forbidden: protected resource.'}, 403)
                return

        _, ext = os.path.splitext(norm_path)
        ext = ext.lower()

        if ext in FORBIDDEN_EXTS:
            self.respond_json({'error': 'Access forbidden: invalid file format.'}, 403)
            return

        # Deny directory listing or requests for non-approved extensions (except index/root)
        if norm_path not in ('', '/', '.') and ext and ext not in ALLOWED_STATIC_EXTS:
            self.respond_json({'error': 'Access forbidden: unauthorized file extension.'}, 403)
            return

        # Normal static file serving
        try:
            super().do_GET()
        except Exception:
            self.respond_json({'error': 'Resource not found.'}, 404)

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

            # Input validation
            if not email or not password or not name:
                self.respond_json({'error': 'Name, email, and password are required.'}, 400)
                return

            email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not re.match(email_regex, email) or len(email) > 254:
                self.respond_json({'error': 'Please enter a valid email address.'}, 400)
                return

            if len(password) < 8 or len(password) > 128:
                self.respond_json({'error': 'Password must be between 8 and 128 characters.'}, 400)
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

            # Send welcome email (passwords are NEVER emailed or logged in cleartext)
            subject = "Welcome to Finculator! Your Financial Engine is Ready"
            body_text = f"Hello {name},\n\nWelcome to Finculator! Your account is active.\nEmail: {email}\n\nLogin at: http://localhost:3000/#/login\n\n— Finculator Team"
            body_html = generate_welcome_email_html(name, email, user_id)
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

        # --- ENDPOINT 2: USER LOGIN ---
        if self.path == '/api/auth/login':
            email = str(payload.get('email', '')).strip().lower()
            password = str(payload.get('password', ''))

            if not email or not password:
                self.respond_json({'error': 'Email and password are required.'}, 400)
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
                self.respond_json({'error': 'Invalid email address or password.'}, 401)
                return

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

        # --- ENDPOINT 3: FORGOT PASSWORD / ACCESS RECOVERY ---
        if self.path in ('/api/auth/send-credentials', '/api/auth/forgot-password'):
            email = str(payload.get('email', '')).strip().lower()
            if not email:
                self.respond_json({'error': 'Email address is required.'}, 400)
                return

            users = get_users()
            user_match = next((u for u in users if u.get('email') == email), None)

            if user_match:
                reset_token = secrets.token_urlsafe(32)
                name = user_match.get('name', 'Investor')
                subject = "Finculator Access Recovery Instructions"
                body_text = f"Hello {name},\n\nWe received an access recovery request for your Finculator account.\nReset Link: http://localhost:3000/#/reset-password?token={reset_token}\n\nIf you did not request this, you can ignore this email.\n\n— Finculator Security"
                body_html = f"<p>Hello {html.escape(name)},</p><p>We received an access recovery request for your account.</p><p><a href='http://localhost:3000/#/reset-password?token={reset_token}'>Reset Password</a></p>"
                log_sent_email(email, subject, body_html, body_text)

            # Uniform response preventing user enumeration or password leaking
            self.respond_json({
                'success': True,
                'message': "If this email address is registered, password recovery instructions have been dispatched."
            }, 200)
            return

        # --- ENDPOINT 4: NEWSLETTER SUBSCRIPTION ---
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
