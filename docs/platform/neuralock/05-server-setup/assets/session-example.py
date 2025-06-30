import time
import json
import base64
from eth_account import Account
from eth_account.messages import encode_defunct
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import requests

class NeuralockSession:
    def __init__(self, server_url, wallet_private_key):
        self.server_url = server_url
        self.wallet = Account.from_key(wallet_private_key)
        self.ephemeral_private_key = None
        self.ephemeral_public_key = None
        self.session_id = None
        self.server_encryption_key = None
        
    def generate_ephemeral_keypair(self):
        """Generate ephemeral ECC keypair for session"""
        private_key = ec.generate_private_key(ec.SECP256K1())
        public_key = private_key.public_key()
        
        # Get raw public key bytes
        public_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        
        self.ephemeral_private_key = private_key
        self.ephemeral_public_key = '0x' + public_bytes.hex()
        
        return self.ephemeral_public_key
    
    def create_signed_message(self, contract_address, ttl=3600):
        """Create and sign session request message"""
        message = {
            "contract": contract_address,
            "user_public_key": self.wallet.address,
            "ephemeral_public_key": self.ephemeral_public_key,
            "ttl": ttl,
            "timestamp": int(time.time()),
            "nonce": base64.b64encode(os.urandom(16)).decode()
        }
        
        # Sign with wallet
        message_json = json.dumps(message, sort_keys=True)
        signable_message = encode_defunct(text=message_json)
        signature = self.wallet.sign_message(signable_message)
        
        return {
            "message": message,
            "signature": signature.signature.hex(),
            "message_raw": message_json
        }
    
    def encrypt_payload(self, data, server_public_key):
        """Encrypt payload using ECDH"""
        # Parse server public key
        server_key_bytes = bytes.fromhex(server_public_key[2:])
        server_public = ec.EllipticCurvePublicKey.from_encoded_point(
            ec.SECP256K1(), 
            server_key_bytes
        )
        
        # Derive shared secret
        shared_secret = self.ephemeral_private_key.exchange(
            ec.ECDH(), 
            server_public
        )
        
        # Derive encryption key
        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'neuralock-session'
        ).derive(shared_secret)
        
        # Encrypt data
        iv = os.urandom(16)
        cipher = Cipher(
            algorithms.AES(derived_key),
            modes.CBC(iv)
        )
        encryptor = cipher.encryptor()
        
        # Pad data to AES block size
        padded_data = self._pad(data.encode())
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        # Return IV + ciphertext
        encrypted = iv + ciphertext
        return base64.b64encode(encrypted).decode()
    
    def create_session(self, contract_address, ttl=3600):
        """Create a new session with the server"""
        # Generate ephemeral keypair
        self.generate_ephemeral_keypair()
        
        # Get server info first
        info_response = requests.get(f"{self.server_url}/api/v1/info")
        server_info = info_response.json()
        server_encryption_key = server_info["encryption_public_key"]
        
        # Create signed message
        signed_data = self.create_signed_message(contract_address, ttl)
        
        # Encrypt the signed message
        encrypted_payload = self.encrypt_payload(
            signed_data["message_raw"],
            server_encryption_key
        )
        
        # Prepare request
        request_data = {
            "signed_message": base64.b64encode(
                signed_data["message_raw"].encode()
            ).decode(),
            "ephemeral_public_key": self.ephemeral_public_key,
            "encrypted_payload": encrypted_payload
        }
        
        # Send request
        response = requests.post(
            f"{self.server_url}/api/v1/session/create",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            self.session_id = result["session_id"]
            self.server_encryption_key = server_encryption_key
            return result
        else:
            raise Exception(f"Session creation failed: {response.text}")
    
    def _pad(self, data):
        """PKCS7 padding"""
        padding_length = 16 - (len(data) % 16)
        padding = bytes([padding_length] * padding_length)
        return data + padding

# Example usage
if __name__ == "__main__":
    import os
    
    # Initialize client
    client = NeuralockSession(
        server_url="https://your-server.example.com",
        wallet_private_key="0x..." # Your wallet private key
    )
    
    # Create session
    session = client.create_session(
        contract_address="0x1234567890abcdef1234567890abcdef12345678",
        ttl=3600  # 1 hour
    )
    
    print(f"Session created: {session['session_id']}")
    print(f"Expires at: {session['expires_at']}")