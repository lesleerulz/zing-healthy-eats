import requests
import sqlite3
import json

# Configuration
BASE_URL = "http://127.0.0.1:5000"
CALLBACK_URL = f"{BASE_URL}/payment/callback"
DB_PATH = "database.db"

def get_pending_order():
    """Find the latest order with a CheckoutRequestID."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # We need an order that has a CheckoutRequestID (meaning STK Push was attempted) 
        # but is potentially still 'Pending' (or we just want to force it to Paid).
        cursor.execute("""
            SELECT id, checkout_request_id, phone_number 
            FROM `order` 
            WHERE checkout_request_id IS NOT NULL 
            AND status != 'Paid'
            ORDER BY id DESC LIMIT 1
        """)
        
        # Note: 'amount' column might not exist if we didn't add it, 
        # but the query above assumes standard schema. 
        # Let's check schema first or just grab known cols.
        # Actually in our previous edit we didn't add 'amount' to Order, 
        # we calculate it from items.
        # So let's just grab the vital info.
        
        cursor.execute("""
            SELECT id, checkout_request_id, phone_number 
            FROM `order` 
            WHERE checkout_request_id IS NOT NULL 
            AND status != 'Paid'
            ORDER BY id DESC LIMIT 1
        """)
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {"id": row[0], "checkout_request_id": row[1], "phone": row[2]}
        return None
        
    except Exception as e:
        print(f"Error accessing database: {e}")
        return None

def simulate_callback(order):
    """Send a success callback for the given order."""
    
    payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "TEST-MERCHANT-ID",
                "CheckoutRequestID": order['checkout_request_id'],
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 100.00},
                        {"Name": "MpesaReceiptNumber", "Value": "TEST123456"},
                        {"Name": "TransactionDate", "Value": 20240101120000},
                        {"Name": "PhoneNumber", "Value": order.get('phone') or 254712345678}
                    ]
                }
            }
        }
    }
    
    print(f"Sending callback for Order #{order['id']} (Req ID: {order['checkout_request_id']})...")
    
    try:
        response = requests.post(CALLBACK_URL, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Failed to send request: {e}")

if __name__ == "__main__":
    print("--- M-Pesa Callback Simulator ---")
    order = get_pending_order()
    
    if order:
        print(f"Found Pending Order: ID {order['id']}")
        simulate_callback(order)
    else:
        print("No pending orders with CheckoutRequestID found in database.")
        print("Please initiate a payment in the app first.")
