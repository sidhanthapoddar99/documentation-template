import time
import json
import base64
import hashlib
from eth_account import Account
from eth_account.messages import encode_defunct
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import requests

class NeuralockEncryption:
    def __init__(self, server_url, session_id, ephemeral_private_key):
        self.server_url = server_url
        self.session_id = session_id
        self.ephemeral_private_key = ephemeral_private_key
        
    def sign_request(self, method, path, body):
        """Sign API request with ephemeral key"""
        timestamp = int(time.time())
        
        # Create message to sign
        message = {
            "method": method,
            "path": path,
            "body": json.dumps(body, sort_keys=True),
            "timestamp": timestamp
        }
        
        # Hash the message
        message_bytes = json.dumps(message, sort_keys=True).encode()
        message_hash = hashlib.sha256(message_bytes).hexdigest()
        
        # Sign with ephemeral key
        # Convert EC key to eth_account compatible format
        private_bytes = self.ephemeral_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        account = Account.from_key(private_bytes)
        
        signable_message = encode_defunct(text=message_hash)
        signature = account.sign_message(signable_message)
        
        return {
            "signature": signature.signature.hex(),
            "timestamp": timestamp
        }
    
    def encrypt_share(self, share_data, server_encryption_key):
        """Encrypt share data using ECDH with server key"""
        # Parse server public key
        server_key_bytes = bytes.fromhex(server_encryption_key[2:])
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
            info=b'neuralock-share-encryption'
        ).derive(shared_secret)
        
        # Generate random IV
        iv = os.urandom(16)
        
        # Encrypt share data
        cipher = Cipher(
            algorithms.AES(derived_key),
            modes.CBC(iv)
        )
        encryptor = cipher.encryptor()
        
        # Pad data
        padded_data = self._pad(share_data)
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        # Return IV + ciphertext
        encrypted = iv + ciphertext
        return base64.b64encode(encrypted).decode()
    
    def store_share(self, contract_address, object_id, share_data, 
                   threshold_config, metadata=None):
        """Store an encrypted share on the server"""
        
        # Get server encryption key
        info_response = requests.get(f"{self.server_url}/api/v1/info")
        server_info = info_response.json()
        server_encryption_key = server_info["encryption_public_key"]
        
        # Encrypt the share
        encrypted_share = self.encrypt_share(share_data, server_encryption_key)
        
        # Prepare request body
        body = {
            "ephemeral_public_key": self.session_id,
            "contract_address": contract_address,
            "object_id": object_id,
            "encrypted_share": encrypted_share,
            "threshold_config": threshold_config,
            "metadata": metadata or {}
        }
        
        # Sign the request
        path = "/api/v1/encrypt"
        signing_data = self.sign_request("POST", path, body)
        
        # Add signature to body
        body["signature"] = signing_data["signature"]
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Signature": signing_data["signature"],
            "X-Timestamp": str(signing_data["timestamp"]),
            "X-Ephemeral-Key": self.session_id
        }
        
        # Send request
        response = requests.post(
            f"{self.server_url}{path}",
            json=body,
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Share storage failed: {response.text}")
    
    def _pad(self, data):
        """PKCS7 padding"""
        if isinstance(data, str):
            data = data.encode()
        padding_length = 16 - (len(data) % 16)
        padding = bytes([padding_length] * padding_length)
        return data + padding

# Example usage
if __name__ == "__main__":
    import os
    from shamir_secret_sharing import split_secret
    
    # Assume we have an active session
    session_id = "0x04abc...def"  # From session creation
    ephemeral_private_key = ec.generate_private_key(ec.SECP256K1())
    
    # Initialize encryption client
    client = NeuralockEncryption(
        server_url="https://your-server.example.com",
        session_id=session_id,
        ephemeral_private_key=ephemeral_private_key
    )
    
    # Secret to protect (e.g., private key)
    secret = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    
    # Split into Shamir shares
    shares = split_secret(
        secret=secret.encode(),
        threshold=2,
        total_shares=3
    )
    
    # Store first share on this server
    result = client.store_share(
        contract_address="0x1234567890abcdef1234567890abcdef12345678",
        object_id="token_123",
        share_data=shares[0],  # First share
        threshold_config={
            "total_shares": 3,
            "threshold": 2,
            "share_index": 1
        },
        metadata={
            "description": "NFT private key share",
            "created_by": "0x742d35Cc6634C0532925a3b844Bc9e7595f6ed3",
            "version": 1
        }
    )
    
    print(f"Share stored successfully:")
    print(f"Object ID: {result['object_id']}")
    print(f"Version: {result['version']}")
    print(f"Storage proof: {result['storage_proof']}")