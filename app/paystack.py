import requests

class PaystackClient:
    """
    Client for interacting with Paystack API.
    """
    def __init__(self, secret_key, base_url="https://api.paystack.co"):
        self.secret_key = secret_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }

    def initialize_transaction(self, email, amount, callback_url, reference=None, metadata=None):
        """
        Initialize a transaction.
        Amount should be in the smallest currency unit (e.g., kobo for NGN, cents for USD/KES).
        """
        api_url = f"{self.base_url}/transaction/initialize"
        data = {
            "email": email,
            "amount": int(amount),
            "callback_url": callback_url
        }
        if reference:
            data["reference"] = reference
        if metadata:
            data["metadata"] = metadata

        try:
            response = requests.post(api_url, json=data, headers=self.headers, timeout=30)
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": False, "message": f"Failed to connect to Paystack: {e}"}

    def charge_mobile_money(self, email, amount, phone, provider="mpesa", reference=None):
        """
        Initiate a mobile money charge.
        """
        api_url = f"{self.base_url}/charge"
        data = {
            "email": email,
            "amount": int(amount),
            "currency": "KES",
            "mobile_money": {
                "phone": phone,
                "provider": provider
            }
        }
        if reference:
            data["reference"] = reference

        try:
            response = requests.post(api_url, json=data, headers=self.headers, timeout=30)
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": False, "message": f"Failed to connect to Paystack: {e}"}

    def verify_transaction(self, reference):
        """
        Verify a transaction using its reference.
        """
        api_url = f"{self.base_url}/transaction/verify/{reference}"
        
        try:
            response = requests.get(api_url, headers=self.headers, timeout=30)
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": False, "message": f"Failed to connect to Paystack: {e}"}
