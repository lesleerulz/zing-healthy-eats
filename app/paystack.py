import requests
import os

class PaystackClient:
    """
    Client for interacting with Paystack API.
    Supports a mock mode for local testing without internet.
    """
    def __init__(self, secret_key, base_url="https://api.paystack.co"):
        self.secret_key = secret_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        # Check if we should use mock mode
        self.mock_mode = os.getenv("PAYSTACK_MOCK", "false").lower() == "true"

    def initialize_transaction(self, email, amount, callback_url, reference=None, metadata=None, channels=None):
        """
        Initialize a transaction.
        """
        if self.mock_mode:
            print(f"[Paystack MOCK] Initializing transaction for {email}, amount {amount}")
            return {
                "status": True,
                "message": "Transaction initialized (MOCK)",
                "data": {
                    "authorization_url": f"{callback_url}?reference={reference or 'MOCK-REF'}",
                    "access_code": "MOCK-CODE",
                    "reference": reference or "MOCK-REF"
                }
            }

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
        if channels:
            data["channels"] = channels

        try:
            response = requests.post(api_url, json=data, headers=self.headers, timeout=30)
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": False, "message": f"Failed to connect to Paystack: {e}"}

    def charge_mobile_money(self, email, amount, phone, provider="mpesa", reference=None):
        """
        Initiate a mobile money charge.
        """
        if self.mock_mode:
            print(f"[Paystack MOCK] Mobile money charge for {phone}, amount {amount}")
            return {
                "status": True,
                "message": "Charge initiated (MOCK)",
                "data": {
                    "status": "success",
                    "reference": reference or "MOCK-KES-REF",
                    "display_text": "MOCK: Check your phone for prompt"
                }
            }

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
        if self.mock_mode or (reference and reference.startswith("MOCK")):
            print(f"[Paystack MOCK] Verifying transaction {reference}")
            return {
                "status": True,
                "message": "Verification successful (MOCK)",
                "data": {
                    "status": "success",
                    "reference": reference,
                    "amount": 0, # Not strictly needed for UI flow
                    "gateway_response": "Successful"
                }
            }

        api_url = f"{self.base_url}/transaction/verify/{reference}"
        
        try:
            response = requests.get(api_url, headers=self.headers, timeout=30)
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": False, "message": f"Failed to connect to Paystack: {e}"}
