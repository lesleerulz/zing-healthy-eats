# Production Deployment Guide (cPanel) - Zing Healthy Treats

This guide covers how to deploy the decoupled Zing Healthy Treats application (Flask Backend + Next.js Frontend) on a standard cPanel environment.

## 1. Architecture Overview
The application is **decoupled**:
- **Backend (API)**: Runs on Python/Flask. Best hosted on a subdomain (e.g., `api.zinghealthytreats.com`).
- **Frontend (UI)**: Runs on Node.js/Next.js. Best hosted on the primary domain (e.g., `zinghealthytreats.com`).

---

## 2. Backend Deployment (Flask API)

### Step 1: Create a Subdomain
In cPanel, create a subdomain like `api.yourdomain.com`.

### Step 2: Setup Python App
1. Go to **Setup Python App** in cPanel.
2. Click **Create Application**.
3. Select Python version (3.9+).
4. **Application root**: Path where your backend files live (e.g., `public_html/api`).
5. **Application URL**: Select your subdomain.
6. Click **Create**.

### Step 3: Upload Files & Install Dependencies
1. Upload all files **except** the `zing-frontend` folder, `node_modules`, and `venv`.
2. In the Python App interface, add `requirements.txt` to the configuration and click **Run Pip Install**.
3. Create a `.env` file in the application root (see the M-Pesa/Google sections below).

### Step 4: Configure `passenger_wsgi.py`
cPanel uses Phusion Passenger. Create/edit `passenger_wsgi.py` in your application root:
```python
import sys
import os

# Add the application directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Import the app factory
from app.app import create_app

# Create the application object for Passenger
application = create_app()
```

---

## 3. Frontend Deployment (Next.js)

### Step 1: Setup Node.js App
1. Go to **Setup Node.js App** in cPanel.
2. **Application root**: `public_html`.
3. **Application URL**: Your primary domain.
4. **Application startup file**: `server.js` (see below).
5. Click **Create**.

### Step 2: Build the App
Since cPanel environments are often resource-constrained, it is highly recommended to **build the app locally** and upload the results:
1. Locally, run: `npm run build`
2. Upload the following to your server:
   - `.next` folder
   - `public` folder
   - `package.json`
   - `next.config.ts`

### Step 3: Environment Variables
Ensure you set the following in the cPanel Node.js App interface or a `.env.production` file:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 4. M-Pesa: Moving to Production

Update your production `.env` file on the server with these live credentials:

| Key | Description |
| :--- | :--- |
| `MPESA_ENV` | Set to `production` |
| `MPESA_SHORTCODE` | Your 6-digit **Till Number** |
| `MPESA_TRANSACTION_TYPE` | Set to `CustomerBuyGoodsOnline` |
| `MPESA_PASSKEY` | Your live passkey from Safaricom |
| `MPESA_CALLBACK_URL` | `https://api.yourdomain.com/api/payments/callback` |

---

## 5. Google OAuth: Production Setup

Google OAuth requires the production URL to be registered in the **Google Cloud Console**.

1. Go to **APIs & Services > Credentials**.
2. Edit your OAuth 2.0 Client ID.
3. Add your production domain to **Authorized JavaScript origins**:
   - `https://yourdomain.com`
4. Add your production callback to **Authorized redirect URIs**:
   - `https://api.yourdomain.com/api/auth/google/callback`

**Important**: Ensure your `.env` on the server has the correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 6. Paystack: Production Setup

To process real payments via Paystack, you need to swap your test credentials for live ones.

### Step 1: Update `.env` with Live Keys
Get these from your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer).

| Key | Description |
| :--- | :--- |
| `PAYSTACK_PUBLIC_KEY` | Your live **Public Key** (`pk_live_...`) |
| `PAYSTACK_SECRET_KEY` | Your live **Secret Key** (`sk_live_...`) |
| `PAYSTACK_CALLBACK_URL` | `https://yourdomain.com/orders` (Frontend success page) |

### Step 2: Configure Webhook
You **must** set up a webhook in the Paystack Dashboard so the backend can confirm payments even if the user closes their browser.

1. Go to **Settings > API Keys & Webhooks**.
2. Set the **Webhook URL** to:
   - `https://api.yourdomain.com/api/payment/paystack/webhook`
3. Click **Save Changes**.

---

## 7. Critical Security Checklist

1. **SECRET_KEY**: Change the `SECRET_KEY` in your `.env` to a long, random string.
2. **Debug Mode**: Ensure `FLASK_DEBUG=False` in your production environment.
3. **CORS**: Ensure the backend allows requests from your frontend domain.
4. **HTTPS**: Always use SSL (Let's Encrypt is free in cPanel) for both the API and the Frontend.
5. **Database**: If switching from SQLite to MySQL, update the `DATABASE_URL` in `.env`:
   - `mysql+pymysql://user:pass@localhost/dbname`
