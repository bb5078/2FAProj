# Deployment Guide

## Architecture

```
Frontend → Netlify (static React build)
Backend  → PythonAnywhere (Flask + SQLite)
```

The frontend and backend are on different domains, so session cookies use
`SameSite=None; Secure=True` for cross-domain requests.

---

## Prerequisites

- GitHub account
- Netlify account (free)
- PythonAnywhere account (free)
- Brevo account with REST API key
- Twilio account (can set up credentials later — see step below)

---

## Step 1 — Push to GitHub

```bash
# From project root (F:/BajwaProjects/Bhanu/Bhanu)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOURUSERNAME/2fa-platform.git
git push -u origin main
```

Make sure `.gitignore` is committed and `backend/.env` is NOT in git.

---

## Step 2 — Deploy Frontend to Netlify

1. Go to https://app.netlify.com → **Add new site** → **Import from Git**
2. Connect your GitHub account and select the repo
3. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Under **Site configuration → Environment variables**, add:
   - `VITE_API_URL` = `https://YOURUSERNAME.pythonanywhere.com`
     *(Leave as `http://localhost:5000` for now — update after Step 3)*
5. Deploy the site. Note your Netlify URL (e.g. `https://bhanu-2fa.netlify.app`)

---

## Step 3 — Deploy Backend to PythonAnywhere

### 3a. Clone the repo

Log in to PythonAnywhere and open a **Bash console**:

```bash
git clone https://github.com/YOURUSERNAME/2fa-platform.git
cd 2fa-platform/backend
```

### 3b. Create virtualenv and install dependencies

```bash
mkvirtualenv 2fa-env --python=python3.11
pip install -r requirements.txt
```

### 3c. Create .env

```bash
cp .env.example .env
nano .env
```

Fill in all values:

```
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
FLASK_ENV=production
DATABASE_URL=sqlite:///instance/2fa.db

BREVO_API_KEY=xkeysib-xxxx...
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=2FA Platform

TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

OTP_EXPIRY_MINUTES=5
MAX_LOGIN_ATTEMPTS=5
SESSION_EXPIRY_MINUTES=30

TOTP_ENCRYPTION_KEY=<generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">

FRONTEND_URL=https://bhanu-2fa.netlify.app
```

### 3d. Generate TOTP encryption key (one-time setup)

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output into `TOTP_ENCRYPTION_KEY` in `.env`.

### 3e. Initialise database

```bash
python -c "
from app import create_app
from app.extensions import db
app = create_app('production')
with app.app_context():
    db.create_all()
    print('Database initialised.')
"
```

### 3f. Configure PythonAnywhere Web App

1. Go to **Web** tab → **Add a new web app**
2. Choose **Manual configuration** → **Python 3.11**
3. Set:
   - **Source code**: `/home/YOURUSERNAME/2fa-platform/backend`
   - **Working directory**: `/home/YOURUSERNAME/2fa-platform/backend`
   - **Virtualenv**: `/home/YOURUSERNAME/.virtualenvs/2fa-env`
4. Edit the **WSGI configuration file** and replace all content with:

```python
import sys
import os
sys.path.insert(0, '/home/YOURUSERNAME/2fa-platform/backend')
from dotenv import load_dotenv
load_dotenv('/home/YOURUSERNAME/2fa-platform/backend/.env')
from app import create_app
application = create_app('production')
```

5. Click **Reload** on the Web tab

### 3g. Test the backend

Visit: `https://YOURUSERNAME.pythonanywhere.com/api/health`

Expected response: `{"status": "ok"}`

---

## Step 4 — Connect Frontend to Live Backend

1. In Netlify dashboard → **Site configuration → Environment variables**
2. Update `VITE_API_URL` = `https://YOURUSERNAME.pythonanywhere.com`
3. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## Step 5 — Test End-to-End

1. Visit your Netlify URL
2. Register an account
3. Log in → you will be prompted for 2FA
4. Set up TOTP (scan QR with Google Authenticator / Authy)
5. Verify TOTP code → access dashboard
6. Check `auth_logs` in PythonAnywhere (SQLite browser or Bash):
   ```bash
   cd ~/2fa-platform/backend
   python -c "
   from app import create_app
   from app.models import AuthLog
   app = create_app('production')
   with app.app_context():
       logs = AuthLog.query.order_by(AuthLog.timestamp.desc()).limit(10).all()
       for log in logs:
           print(log.event_type, log.success, log.timestamp)
   "
   ```

---

## Brevo Setup

1. Go to https://app.brevo.com/settings/keys/api
2. Create a new REST API key (NOT the SMTP key)
3. Go to **Senders & IPs → Senders** and add/verify your sender email
4. Add the key and sender email to PythonAnywhere `.env`

---

## Twilio Setup

1. Create account at https://www.twilio.com
2. Get a Twilio phone number (free trial)
3. Note: **Trial accounts can only send SMS to verified phone numbers**
   - Go to **Phone Numbers → Verified Caller IDs** and add test numbers
   - Upgrade to paid account for unrestricted sending
4. Add SID, auth token, and phone number to `.env`

---

## Updating After Code Changes

```bash
# On PythonAnywhere Bash console
cd ~/2fa-platform
git pull origin main
# If requirements changed:
workon 2fa-env && pip install -r backend/requirements.txt
# Then reload from the Web tab
```

---

## Security Checklist Before Final Demo

- [ ] `.env` is not in git history (`git log --all -- backend/.env` shows nothing)
- [ ] `FLASK_ENV=production` in PythonAnywhere environment
- [ ] `SESSION_COOKIE_SECURE=True` in production config
- [ ] `FRONTEND_URL` set to exact Netlify URL (no trailing slash)
- [ ] All 6 database tables exist: `users`, `sessions`, `otp_codes`, `totp_secrets`, `auth_logs`, `admin_config`
- [ ] Account locks after 5 failed logins (manually test)
- [ ] TOTP codes verified with Google Authenticator
- [ ] Email OTP received via Brevo
