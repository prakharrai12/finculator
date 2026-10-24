# Finculator Production Deployment & Launch Guide

This guide details step-by-step instructions for deploying **Finculator** to **Cloudflare Pages**, **Vercel**, or a **Self-Hosted VPS** with zero downtime, optimal edge performance, and enterprise-grade security.

---

## 1. Architecture Overview

Finculator is built on a high-efficiency **Zero-Defect Jamstack Architecture**:
- **Front-End**: Pure ES Modules, vanilla CSS, self-hosted WOFF2 fonts, and prerendered static HTML pages for all 27 calculators.
- **Client Execution**: 100% of calculations run locally in the user's browser sandbox.
- **Edge AI Proxy**: Optional serverless edge function (`/api/ai/query`) to broker queries to the Google Gemini API without exposing credentials to client browsers. If no API key is set, the platform automatically fails back to an offline rule-based knowledge engine.

---

## 2. Option A: Cloudflare Pages (Recommended)

Cloudflare Pages provides global edge CDN distribution, free SSL, DDoS mitigation, and native edge functions.

### Step 1: Connect Repository
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Select your `finculator` GitHub repository.

### Step 2: Configure Build Settings
Configure the build settings exactly as follows:
- **Framework preset**: `None`
- **Build command**: `node scripts/generate_seo_pages.js && node scripts/generate_legal_pages.js`
- **Build output directory**: `.`
- **Root directory**: `/` (Leave default)

### Step 3: Configure Environment Variables
In the Cloudflare Pages settings under **Settings** $\rightarrow$ **Environment Variables**:
- `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key.
- `NODE_VERSION`: `22`
- `APP_ENV`: `production`

### Step 4: Verify Assets & Functions
- **Security Headers**: Cloudflare automatically applies the headers defined in [_headers](file:///_headers) (Strict CSP, HSTS, X-Frame-Options DENY, and 1-year immutable font caching).
- **Edge Function**: Cloudflare automatically compiles [functions/api/ai.js](file:///functions/api/ai.js) to handle AI copilot proxy requests.
- **Deployment**: Click **Save and Deploy**. Your site will be live across 300+ global data centers in under 60 seconds.

---

## 3. Option B: Vercel Deployment

Vercel provides immediate git-integrated deployments with clean URLs and Node.js serverless functions.

### Step 1: Import Project
1. Open your [Vercel Dashboard](https://vercel.com/) and click **Add New** $\rightarrow$ **Project**.
2. Import the `finculator` repository.

### Step 2: Build & Output Settings
- **Framework Preset**: `Other`
- **Build Command**: `node scripts/generate_seo_pages.js && node scripts/generate_legal_pages.js`
- **Output Directory**: `.`
- **Install Command**: `npm ci`

### Step 3: Environment Variables
Add the following under **Project Settings** $\rightarrow$ **Environment Variables**:
- `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key.
- `APP_ENV`: `production`

### Step 4: Verify Routing & Headers
- [vercel.json](file:///vercel.json) automatically enforces:
  - `"cleanUrls": true` (maps `/emi-calculator` to `emi-calculator.html` without redirects)
  - `"trailingSlash": false`
  - Strict Content Security Policy & HSTS headers
  - Immutable caching for `.woff2`, `.png`, and `.webp` assets.
- [api/ai.js](file:///api/ai.js) is automatically deployed as a Vercel Serverless Function serving `/api/ai/query`.

---

## 4. Option C: Self-Hosted Linux VPS / Docker / Python Server

If deploying to a dedicated Linux server (Ubuntu/Debian) using the built-in hardened `server.py`:

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/prakharrai12/finculator.git /var/www/finculator
cd /var/www/finculator
cp .env.example .env
nano .env
```

Ensure `.env` contains:
```ini
APP_ENV=production
PORT=3000
HOST=127.0.0.1
SECRET_KEY=generate_a_random_32_character_string_here
ADMIN_API_KEY=generate_a_random_16_character_string_here
GEMINI_API_KEY=your_gemini_api_key_if_applicable
ALLOWED_ORIGINS=https://finculator.app,https://www.finculator.app
ENFORCE_HTTPS=true
CSRF_PROTECTION_ENABLED=true
```

### Step 2: Prebuild Static SEO Pages
```bash
node scripts/generate_seo_pages.js
node scripts/generate_legal_pages.js
```

### Step 3: Create Systemd Service
Create `/etc/systemd/system/finculator.service`:
```ini
[Unit]
Description=Finculator High-Utility Financial Suite
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/finculator
ExecStart=/usr/bin/python3 /var/www/finculator/server.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now finculator
sudo systemctl status finculator
```

### Step 4: Configure Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name finculator.app www.finculator.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name finculator.app www.finculator.app;

    ssl_certificate /etc/letsencrypt/live/finculator.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/finculator.app/privkey.pem;

    root /var/www/finculator;

    # Static assets with caching
    location ~* \.(woff2|png|webp|jpg|svg|ico)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Pass all other requests to internal python server
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Pre-Flight Launch Verification Checklist

Run through this checklist before announcing the public release:

- [x] **Automated Tests**: Run `npm test` — all 44 unit tests must pass with 0 failures.
- [x] **Security Suite**: Run `python tests/test_auth_and_system.py` — 100% verified.
- [x] **Git Cleanliness**: Run `git log --all --full-history -- "data/*"` — returns 0 commits.
- [x] **Clean URLs**: Verify `https://finculator.app/emi-calculator` loads without redirection loops.
- [x] **Fonts**: Verify all fonts load locally from `/fonts/` with 0 requests to `fonts.googleapis.com`.
- [x] **Core Web Vitals**: Verify Lighthouse score $\ge 95$ on desktop and mobile.
- [x] **Sitemap**: Verify `https://finculator.app/sitemap.xml` contains all 31 calculator endpoints and 5 legal pages.
- [x] **Robots**: Verify `https://finculator.app/robots.txt` is accessible and points to the sitemap.
- [x] **Legal Disclosures**: Verify `/privacy.html`, `/terms.html`, `/disclaimer.html`, `/about.html`, and `/contact.html` are live and linked in the footer.
- [x] **Search Console**: Add property in Google Search Console and submit `sitemap.xml`.
