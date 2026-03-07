import requests
import base64
from datetime import datetime

class MpesaClient:
    """
    Client for interacting with Safaricom M-Pesa Daraja API.
    """
    def __init__(self, consumer_key, consumer_secret, shortcode, passkey, transaction_type="CustomerBuyGoodsOnline", base_url="https://sandbox.safaricom.co.ke"):
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
        
        try:
            response = requests.get(api_url, auth=(self.consumer_key, self.consumer_secret), timeout=30)
            print(f"[M-Pesa Token] Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to connect to M-Pesa API: {e}")
        
        if response.status_code == 200:
            try:
                data = response.json()
            except ValueError:
                raise Exception(f"M-Pesa token response is not valid JSON: {response.text[:200]}")
            self.token = data['access_token']
            self.token_expiry = datetime.now().timestamp() + int(data['expires_in'])
            return self.token
        else:
            raise Exception(f"Failed to generate token (HTTP {response.status_code}): {response.text[:200]}")

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
        if not self.token or datetime.now().timestamp() >= self.token_expiry:
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
        
        try:
            response = requests.post(api_url, json=request_data, headers=headers, timeout=30)
            print(f"[M-Pesa STK Push] Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            return {"errorMessage": f"Failed to connect to M-Pesa: {e}"}
        
        try:
            return response.json()
        except ValueError:
            return {"errorMessage": f"M-Pesa returned invalid response (HTTP {response.status_code}): {response.text[:200]}"}

    def query_transaction_status(self, checkout_request_id):
        """
        Check the status of a transaction.
        """
        if not self.token or datetime.now().timestamp() >= self.token_expiry:
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
        
        try:
            response = requests.post(api_url, json=request_data, headers=headers, timeout=30)
            print(f"[M-Pesa Status Query] Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            return {"errorMessage": f"Failed to connect to M-Pesa: {e}"}
        
        try:
            return response.json()
        except ValueError:
            return {"errorMessage": f"M-Pesa returned invalid response (HTTP {response.status_code}): {response.text[:200]}"}
