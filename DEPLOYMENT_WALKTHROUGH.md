# 🚀 Zing Healthy Treats — cPanel Deployment Walkthrough

> **Live site:** https://zinghealthytreats.com
> **Hosting:** Truehost cPanel (Phusion Passenger + Apache)

---

## 1. Environment & Infrastructure

| Setting | Value |
|---|---|
| **Python Version** | 3.12 |
| **Virtual Environment** | `/home/ckejobqv/virtualenv/zing_healthy_eats/3.12/` |
| **Application Root** | `/home/ckejobqv/zing_healthy_eats/` |
| **Startup File** | `passenger_wsgi.py` |
| **Entry Point** | `application` |

### Activate venv in Terminal
```bash
source /home/ckejobqv/virtualenv/zing_healthy_eats/3.12/bin/activate && cd /home/ckejobqv/zing_healthy_eats
```

---

## 2. WSGI Bridge (`passenger_wsgi.py`)

```python
import sys, os

project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

from app.app import create_app
application = create_app()
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Database Initialization

```bash
python
```
```python
from app.app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print("Tables created!")
exit()
```

Then fix permissions:
```bash
chmod 666 /home/ckejobqv/zing_healthy_eats/database.db
chmod 755 /home/ckejobqv/zing_healthy_eats/
```

---

## 5. Create Admin User

```bash
python
```
```python
from app.app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    admin = User(username="Leslee", email="lesleenyanducha@gmail.com", is_admin=True)
    admin.set_password("YourPasswordHere")
    db.session.add(admin)
    db.session.commit()
    print("Admin created!")
exit()
```

---

## 6. Environment Variables (cPanel → Setup Python App → Edit)

| Variable | Value |
|---|---|
| `SECRET_KEY` | *(strong random string)* |
| `DATABASE_URL` | `sqlite:///database.db` or MySQL URL |
| `MPESA_CONSUMER_KEY` | *(your key)* |
| `MPESA_CONSUMER_SECRET` | *(your secret)* |
| `MPESA_SHORTCODE` | *(your shortcode)* |
| `MPESA_PASSKEY` | *(your passkey)* |
| `MPESA_CALLBACK_URL` | `https://zinghealthytreats.com/payment/callback` |
| `MPESA_TRANSACTION_TYPE` | `CustomerPayBillOnline` ⚠️ exact spelling matters |
| `GOOGLE_CLIENT_ID` | *(optional)* |
| `GOOGLE_CLIENT_SECRET` | *(optional)* |

---

## 7. `.htaccess` (public_html)

```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Route all requests to Passenger
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /zing_healthy_eats/passenger_wsgi.py/$1 [QSA,L]
```

---

## 8. Restart

In **Setup Python App → Restart** after any changes.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| **500 Error** | Check `stderr.log` in app folder via File Manager |
| **Missing module** | Re-run `pip install -r requirements.txt` |
| **DB write errors** | `chmod 666 database.db` |
| **M-Pesa rejected** | Check `MPESA_TRANSACTION_TYPE` spelling |
| **Images 404** | Confirm `static/` uploaded; contact Truehost to map static files |
