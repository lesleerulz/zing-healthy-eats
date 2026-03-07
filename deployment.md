# Deployment Guide - Zing Healthy Treats

This guide contains the essential steps to prepare the application for production deployment, specifically focusing on migrating the M-Pesa integration from the Sandbox to Production.

## 1. M-Pesa: Moving from Sandbox to Production

Currently, the application runs on the Safaricom M-Pesa **Sandbox** using a test **Paybill** number. To connect it to your real **Till Number**, you must update the `.env` file on your production server (e.g., cPanel).

### Prerequisites
Before going live, ensure you have:
1. Created an app on [developer.safaricom.co.ke](https://developer.safaricom.co.ke) and configured it for production to generate your Live Consumer Key and Secret.
2. Obtained your real Till Number and your M-Pesa Passkey (provided by Safaricom when you go live).

### The 3 Critical `.env` Changes to Make
To switch to the live Till Number, you must update three specific keys in your production `.env` file:

**1. The Shortcode (Till Number):**
Update this from the sandbox `174379` to your actual 6-digit Till Number.
```env
MPESA_SHORTCODE=123456  # Replace with your Till Number
```

**2. The Transaction Type:**
Since you are using a Till Number (Buy Goods) instead of a Paybill, you **must** change the transaction type. If this is wrong, payments will fail.
```env
# Change this from "CustomerPayBillOnline" to:
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
```

**3. The Environment Variable:**
Tell the code to hit the live Safaricom API instead of the sandbox API.
```env
# Change this from "sandbox" to "production"
MPESA_ENV=production
```

### Full Production `.env` M-Pesa Block Example:
```env
# Generate these on your live Safaricom Developer portal
MPESA_CONSUMER_KEY=your_live_consumer_key_here
MPESA_CONSUMER_SECRET=your_live_consumer_secret_here

# Your actual Live Till Number
MPESA_SHORTCODE=4243516

# The live passkey provided by Safaricom when your Till went live
MPESA_PASSKEY=your_live_passkey_here

# Your live, publicly accessible callback URL
MPESA_CALLBACK_URL=https://zinghealthytreats.com/payment/callback

# REQUIRED FOR TILL NUMBERS
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline

# REQUIRED TO HIT LIVE SERVERS
MPESA_ENV=production
```

## 2. General Deployment Notes

1. **Flask Environment**: Make sure your `.env` has `FLASK_ENV=production` and `FLASK_DEBUG=False` to disable the development debugger on the live site.
2. **Database**: Your SQLite database `instance/database.db` will automatically migrate your configured settings. Make sure the `instance` directory has proper write permissions on your server.
3. **Secret Key**: Set a strong, random `SECRET_KEY` in your production `.env` to secure user sessions.
