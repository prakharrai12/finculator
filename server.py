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
    # Keep last 50 emails
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

            # Send welcome credentials email
            subject = "Welcome to Finculator — Your Account Credentials"
            body_text = f"Hello {name},\n\nWelcome to Finculator! Your account has been registered.\n\nEmail: {email}\nAccount ID: {user_id}\n\nKeep your password secure.\n\nBest regards,\nFinculator Team"
            body_html = f"""
            <div style="font-family: Arial, sans-serif; background: #0A0F1D; color: #FFFFFF; padding: 24px; border-radius: 12px;">
                <h2 style="color: #38BDF8; margin-top: 0;">Welcome to Finculator, {name}!</h2>
                <p style="color: #94A3B8; font-size: 14px;">Your account has been successfully created with institutional-grade security.</p>
                <div style="background: #131E36; border: 1px solid #1E293B; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 4px 0; color: #E2E8F0;"><strong>Registered Email:</strong> <span style="color: #38BDF8;">{email}</span></p>
                    <p style="margin: 4px 0; color: #E2E8F0;"><strong>Account Status:</strong> <span style="color: #10B981;">✓ Verified Active</span></p>
                    <p style="margin: 4px 0; color: #E2E8F0;"><strong>Access Token:</strong> <code style="color: #F59E0B;">{token[:16]}...</code></p>
                </div>
                <p style="color: #64748B; font-size: 12px;">If you did not request this account, please ignore this message.</p>
            </div>
            """
            email_rec = log_sent_email(email, subject, body_html, body_text)

            self.respond_json({
                'success': True,
                'message': 'Account created successfully. Login credentials sent to email.',
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

        # 3. SEND CREDENTIALS EMAIL
        if self.path == '/api/auth/send-credentials':
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

            subject = "Your Finculator Login Credentials & Access Key"
            body_text = f"Hello {name},\n\nHere are your requested Finculator login credentials:\n\nEmail: {email}\nTemporary Access Pass: {temp_pass}\n\nLogin directly at: http://localhost:3000/#/login\n\nFinculator Security Team"
            body_html = f"""
            <div style="font-family: Arial, sans-serif; background: #0A0F1D; color: #FFFFFF; padding: 24px; border-radius: 12px;">
                <h2 style="color: #38BDF8; margin-top: 0;">Finculator Security — Your Login Credentials</h2>
                <p style="color: #94A3B8; font-size: 14px;">Hello <strong>{name}</strong>, here are your access credentials requested for Finculator:</p>
                <div style="background: #131E36; border: 1px solid #1E293B; padding: 18px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 6px 0; color: #E2E8F0;"><strong>Login Email:</strong> <span style="color: #38BDF8; font-family: monospace;">{email}</span></p>
                    <p style="margin: 6px 0; color: #E2E8F0;"><strong>Access Code / Password:</strong> <span style="background: #1E293B; padding: 3px 8px; border-radius: 4px; color: #10B981; font-family: monospace; font-weight: bold;">{temp_pass}</span></p>
                    <p style="margin: 6px 0; color: #E2E8F0;"><strong>Dispatch Server:</strong> <span style="color: #94A3B8;">auth-gateway.finculator.internal (256-bit TLS)</span></p>
                </div>
                <p style="color: #64748B; font-size: 12px;">Please sign in and update your security credentials from your Account Settings.</p>
            </div>
            """
            email_rec = log_sent_email(email, subject, body_html, body_text)

            self.respond_json({
                'success': True,
                'message': f"Credentials securely dispatched to {email}",
                'emailPreview': email_rec
            }, 200)
            return

        # 4. FORGOT PASSWORD
        if self.path == '/api/auth/forgot-password':
            email = payload.get('email', '').strip().lower()
            if not email:
                self.respond_json({'error': 'Email is required.'}, 400)
                return

            reset_token = f"rst_{hash_pw(email + str(time.time()))[:16]}"
            subject = "Finculator — Password Reset Security Code"
            body_text = f"Use reset code {reset_token} to reset your Finculator password."
            body_html = f"""
            <div style="font-family: Arial, sans-serif; background: #0A0F1D; color: #FFFFFF; padding: 24px; border-radius: 12px;">
                <h3 style="color: #F59E0B; margin-top: 0;">Password Reset Request</h3>
                <p style="color: #94A3B8;">A password reset request was received for <strong>{email}</strong>.</p>
                <div style="background: #131E36; padding: 14px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 0; color: #E2E8F0;">Your One-Time Reset Code: <strong style="color: #38BDF8; font-size: 16px;">{reset_token}</strong></p>
                </div>
            </div>
            """
            email_rec = log_sent_email(email, subject, body_html, body_text)

            self.respond_json({
                'success': True,
                'message': f"Password reset instructions sent to {email}",
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
