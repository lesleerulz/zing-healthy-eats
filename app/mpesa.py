import requests
import base64
from datetime import datetime

class MpesaClient:
    """
    Client for interacting with Safaricom M-Pesa Daraja API.
    """
    def __init__(self, consumer_key, consumer_secret, shortcode, passkey, transaction_type="CustomerPayBillOnline", base_url="https://sandbox.safaricom.co.ke"):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.shortcode = shortcode
        self.passkey = passkey
        self.transaction_type = transaction_type
        self.base_url = base_url
        self.token = None
        self.token_expiry = 0

    def get_token(self):
        """
        Generate access token.
        """
        api_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(api_url, auth=(self.consumer_key, self.consumer_secret))
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            self.token_expiry = datetime.now().timestamp() + int(data['expires_in'])
            return self.token
        else:
            raise Exception(f"Failed to generate token: {response.text}")

    def get_password(self):
        """
        Generate password for STK Push.
        """
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        return base64.b64encode(password_str.encode()).decode(), timestamp

    def stk_push(self, phone_number, amount, callback_url, account_reference="Shop", transaction_desc="Payment"):
        """
        Initiate STK Push (Lipa Na M-Pesa Online).
        """
        if not self.token:
            self.get_token()
            
        api_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        password, timestamp = self.get_password()
        
        request_data = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": self.transaction_type,
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }
        
        response = requests.post(api_url, json=request_data, headers=headers)
        return response.json()

    def query_transaction_status(self, checkout_request_id):
        """
        Check the status of a transaction.
        """
        if not self.token:
            self.get_token()
            
        api_url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        password, timestamp = self.get_password()
        
        request_data = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }
        
        response = requests.post(api_url, json=request_data, headers=headers)
        return response.json()
