import requests
import sqlite3
import json
import sys

# Configuration
BASE_URL = "http://127.0.0.1:5000"
WEBHOOK_URL = f"{BASE_URL}/payment/paystack/webhook"
DB_PATH = "instance/database.db"

def get_pending_order():
    """Find the latest order with a paystack_reference."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, paystack_reference, user_id 
            FROM "order" 
            WHERE paystack_reference IS NOT NULL 
            AND status = 'Pending'
            ORDER BY id DESC LIMIT 1
        """)
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {"id": row[0], "reference": row[1], "user_id": row[2]}
        return None
        
    except Exception as e:
        print(f"Error accessing database: {e}")
        return None

def simulate_webhook(order, status="success"):
    """Send a Paystack webhook event for the given order."""
    
    event = "charge.success" if status == "success" else "charge.failed"
    
    payload = {
        "event": event,
        "data": {
            "id": 123456789,
            "domain": "test",
            "status": "success" if status == "success" else "failed",
            "reference": order['reference'],
            "amount": 10000, # Example amount in cents
            "gateway_response": "Successful" if status == "success" else "Declined",
            "customer": {
                "email": "test@example.com"
            }
        }
    }
    
    print(f"--- Simulating Paystack Webhook ({event}) ---")
    print(f"Order ID: {order['id']}")
    print(f"Reference: {order['reference']}")
    print(f"Target URL: {WEBHOOK_URL}")
    
    try:
        # Note: In production, Paystack sends a signature header. 
        # The current app code has signature verification commented out.
        headers = {"Content-Type": "application/json"}
        response = requests.post(WEBHOOK_URL, json=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("\nSuccess! The backend should have updated the order status.")
        else:
            print("\nFailed! Check the backend logs for errors.")
            
    except Exception as e:
        print(f"Failed to send request: {e}")

if __name__ == "__main__":
    order = get_pending_order()
    
    if order:
        status_choice = "success"
        if len(sys.argv) > 1 and sys.argv[1].lower() == "failed":
            status_choice = "failed"
            
        simulate_webhook(order, status_choice)
    else:
        print("No pending orders with paystack_reference found in database.")
        print("Please initiate a Paystack or M-Pesa payment in the app first to create an order.")
