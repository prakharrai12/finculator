import http.server
import socketserver
import os
import mimetypes
import json
import hashlib
import time
import uuid

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
EMAILS_FILE = os.path.join(DATA_DIR, 'sent_emails.json')

os.makedirs(DATA_DIR, exist_ok=True)

# Initialize database files if missing
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)

if not os.path.exists(EMAILS_FILE):
    with open(EMAILS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/svg+xml', '.svg')

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_users():
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2)

def generate_welcome_email_html(name, email, password, token, user_id):
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="margin: 0; padding: 0; background-color: #0A0F1D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #0D1526; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
        
        <!-- Big Logo Header -->
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

        <!-- Main Content -->
        <tr>
          <td style="padding: 36px 32px 24px 32px;">
            <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 700; margin: 0 0 12px 0;">Thanks for Joining Finculator, {name}! 🎉</h1>
            <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              We are delighted to welcome you. Finculator is your institutional financial computation and wealth optimization platform — engineered to help you simulate loans, compound investments, navigate taxes, and build advisory-grade portfolios with 100% mathematical precision.
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #131E36; border: 1px solid #2563EB; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
              <div style="font-size: 13px; font-weight: 700; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
                🔐 Your Account Credentials
              </div>
              <table width="100%" cellpadding="6" cellspacing="0">
                <tr>
                  <td width="38%" style="color: #94A3B8; font-size: 14px; font-weight: 600;">Registered Email:</td>
                  <td style="color: #FFFFFF; font-size: 14px; font-family: monospace; font-weight: bold;">{email}</td>
                </tr>
                <tr>
                  <td style="color: #94A3B8; font-size: 14px; font-weight: 600;">Account Password:</td>
                  <td style="color: #10B981; font-size: 14px; font-family: monospace; font-weight: bold;">{password}</td>
                </tr>
                <tr>
                  <td style="color: #94A3B8; font-size: 14px; font-weight: 600;">Security Status:</td>
                  <td style="color: #38BDF8; font-size: 14px;">✓ Verified Active</td>
                </tr>
                <tr>
                  <td style="color: #94A3B8; font-size: 14px; font-weight: 600;">Security User ID:</td>
                  <td style="color: #64748B; font-size: 12px; font-family: monospace;">{user_id}</td>
                </tr>
              </table>
            </div>

            <!-- Call to Action -->
            <div align="center" style="margin-bottom: 30px;">
              <a href="http://localhost:3000/#/login" style="background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%); color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 6px 20px rgba(37,99,235,0.4);">
                Access Your Financial Dashboard →
              </a>
            </div>

            <!-- Getting Started Tips -->
            <div style="border-top: 1px solid #1E293B; padding-top: 20px;">
              <div style="color: #E2E8F0; font-size: 14px; font-weight: 700; margin-bottom: 8px;">What You Can Do Next:</div>
              <ul style="color: #94A3B8; font-size: 13px; line-height: 1.6; padding-left: 20px; margin: 0;">
                <li>Explore 13 calibrated calculators across Loans, SIPs, Taxes, and FIRE.</li>
                <li>Build your itemized Net Worth & Investment Portfolio in seconds.</li>
                <li>Export institutional wealth management statements in printable PDF.</li>
              </ul>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding: 24px; background-color: #0A0F1D; border-top: 1px solid #1E293B;">
            <p style="color: #64748B; font-size: 12px; margin: 0 0 6px 0;">
              Finculator Security Team • 256-Bit Encrypted Financial Architecture
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
    with open(EMAILS_FILE, 'w', encoding='utf-8') as f:
        json.dump(emails, f, indent=2)
    return email_record

class FinculatorHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Force no caching during development so updates appear immediately
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/auth/sent-emails':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            try:
                with open(EMAILS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                data = []
            self.wfile.write(json.dumps(data).encode('utf-8'))
            return
        super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        try:
            payload = json.loads(post_data) if post_data else {}
        except Exception:
            payload = {}

        # 1. REGISTER
        if self.path == '/api/auth/register':
            name = payload.get('name', '').strip()
            email = payload.get('email', '').strip().lower()
            password = payload.get('password', '')

            if not email or not password or not name:
                self.respond_json({'error': 'Name, email, and password are required.'}, 400)
                return

            users = get_users()
            for u in users:
                if u.get('email') == email:
                    self.respond_json({'error': 'An account with this email address already exists.'}, 409)
                    return

            user_id = str(uuid.uuid4())
            token = f"fin_tok_{hash_pw(user_id + str(time.time()))[:32]}"
            new_user = {
                'id': user_id,
                'name': name,
                'email': email,
                'passwordHash': hash_pw(password),
                'createdAt': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
                'lastLogin': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            }
            users.append(new_user)
            save_users(users)

            # Send rich welcome credentials email
            subject = f"Thanks for Joining Finculator! Here Are Your Login Credentials"
            body_text = f"Thanks for Joining Finculator, {name}!\n\nHere are your login credentials:\nEmail: {email}\nPassword: {password}\n\nLogin at: http://localhost:3000/#/login\n\n— Finculator Team"
            body_html = generate_welcome_email_html(name, email, password, token, user_id)
            email_rec = log_sent_email(email, subject, body_html, body_text)

            self.respond_json({
                'success': True,
                'message': f"Account created! Login credentials dispatched directly to {email}",
                'user': {
                    'id': user_id,
                    'name': name,
                    'email': email
                },
                'token': token,
                'emailPreview': email_rec
            }, 201)
            return

        # 2. LOGIN
        if self.path == '/api/auth/login':
            email = payload.get('email', '').strip().lower()
            password = payload.get('password', '')

            if not email or not password:
                self.respond_json({'error': 'Email and password are required.'}, 400)
                return

            users = get_users()
            target_user = None
            for u in users:
                if u.get('email') == email and u.get('passwordHash') == hash_pw(password):
                    target_user = u
                    break

            if not target_user:
                self.respond_json({'error': 'Invalid email address or password.'}, 401)
                return

            target_user['lastLogin'] = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            save_users(users)
            token = f"fin_tok_{hash_pw(target_user['id'] + str(time.time()))[:32]}"

            self.respond_json({
                'success': True,
                'message': f"Welcome back, {target_user['name']}!",
                'user': {
                    'id': target_user['id'],
                    'name': target_user['name'],
                    'email': target_user['email']
                },
                'token': token
            }, 200)
            return

        # 3. SEND CREDENTIALS EMAIL / FORGOT PASSWORD
        if self.path == '/api/auth/send-credentials' or self.path == '/api/auth/forgot-password':
            email = payload.get('email', '').strip().lower()
            if not email:
                self.respond_json({'error': 'Email is required to send credentials.'}, 400)
                return

            users = get_users()
            user_match = next((u for u in users if u.get('email') == email), None)

            temp_pass = f"Fin@{int(time.time()) % 10000:04d}"
            name = user_match.get('name') if user_match else email.split('@')[0].capitalize()

            if not user_match:
                # Create user with temporary password
                user_id = str(uuid.uuid4())
                user_match = {
                    'id': user_id,
                    'name': name,
                    'email': email,
                    'passwordHash': hash_pw(temp_pass),
                    'createdAt': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
                    'lastLogin': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
                }
                users.append(user_match)
                save_users(users)
            else:
                # Reset password to temporary pass
                user_match['passwordHash'] = hash_pw(temp_pass)
                save_users(users)
                user_id = user_match.get('id', str(uuid.uuid4()))

            subject = "Your Finculator Login Credentials & Access Pass"
            body_text = f"Hello {name},\n\nHere are your Finculator login credentials:\nEmail: {email}\nPassword: {temp_pass}\n\nLogin at: http://localhost:3000/#/login\n\n— Finculator Team"
            token = f"fin_tok_{hash_pw(user_id + str(time.time()))[:32]}"
            body_html = generate_welcome_email_html(name, email, temp_pass, token, user_id)
            email_rec = log_sent_email(email, subject, body_html, body_text)

            self.respond_json({
                'success': True,
                'message': f"Login credentials sent directly to {email}",
                'emailPreview': email_rec
            }, 200)
            return

        self.respond_json({'error': 'Endpoint not found'}, 404)

    def respond_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), FinculatorHandler) as httpd:
        print(f"Finculator HTTP & Auth Server active at http://localhost:{PORT}")
        httpd.serve_forever()
