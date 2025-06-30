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

class NeuralockDecryption:
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
    
    def decrypt_share(self, encrypted_share, server_encryption_key):
        """Decrypt share data received from server"""
        # Decode from base64
        encrypted_data = base64.b64decode(encrypted_share)
        
        # Extract IV and ciphertext
        iv = encrypted_data[:16]
        ciphertext = encrypted_data[16:]
        
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
        
        # Derive decryption key
        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'neuralock-share-encryption'
        ).derive(shared_secret)
        
        # Decrypt
        cipher = Cipher(
            algorithms.AES(derived_key),
            modes.CBC(iv)
        )
        decryptor = cipher.decryptor()
        padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Remove padding
        plaintext = self._unpad(padded_plaintext)
        
        return plaintext
    
    def retrieve_share(self, contract_address, object_id, version=None):
        """Retrieve an encrypted share from the server"""
        
        # Get server info for encryption key
        info_response = requests.get(f"{self.server_url}/api/v1/info")
        server_info = info_response.json()
        server_encryption_key = server_info["encryption_public_key"]
        
        # Prepare request body
        body = {
            "ephemeral_public_key": self.session_id,
            "contract_address": contract_address,
            "object_id": object_id,
            "version": version  # None for latest
        }
        
        # Sign the request
        path = "/api/v1/decrypt"
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
            result = response.json()
            
            # Decrypt the share
            decrypted_share = self.decrypt_share(
                result["encrypted_share"],
                server_encryption_key
            )
            
            return {
                "share": decrypted_share,
                "share_index": result["share_index"],
                "version": result["version"],
                "threshold_info": result["threshold_info"],
                "metadata": result["metadata"]
            }
        else:
            raise Exception(f"Share retrieval failed: {response.text}")
    
    def retrieve_all_shares(self, contract_address, object_id, servers):
        """Retrieve shares from multiple servers for reconstruction"""
        shares = []
        
        for server_url in servers:
            try:
                # Create client for each server
                client = NeuralockDecryption(
                    server_url=server_url,
                    session_id=self.session_id,
                    ephemeral_private_key=self.ephemeral_private_key
                )
                
                # Retrieve share
                share_data = client.retrieve_share(
                    contract_address=contract_address,
                    object_id=object_id
                )
                
                shares.append({
                    "server": server_url,
                    "share": share_data["share"],
                    "index": share_data["share_index"],
                    "threshold_info": share_data["threshold_info"]
                })
                
                # Check if we have enough shares
                threshold = share_data["threshold_info"]["threshold"]
                if len(shares) >= threshold:
                    break
                    
            except Exception as e:
                print(f"Failed to retrieve from {server_url}: {e}")
                continue
        
        return shares
    
    def _unpad(self, data):
        """Remove PKCS7 padding"""
        padding_length = data[-1]
        return data[:-padding_length]

# Example usage
if __name__ == "__main__":
    from shamir_secret_sharing import reconstruct_secret
    
    # Assume we have an active session
    session_id = "0x04abc...def"  # From session creation
    ephemeral_private_key = ec.generate_private_key(ec.SECP256K1())
    
    # Initialize decryption client
    client = NeuralockDecryption(
        server_url="https://server1.neuralock.io",
        session_id=session_id,
        ephemeral_private_key=ephemeral_private_key
    )
    
    # Retrieve single share
    share_data = client.retrieve_share(
        contract_address="0x1234567890abcdef1234567890abcdef12345678",
        object_id="token_123"
    )
    
    print(f"Retrieved share index: {share_data['share_index']}")
    print(f"Version: {share_data['version']}")
    print(f"Threshold: {share_data['threshold_info']['threshold']}/{share_data['threshold_info']['total_shares']}")
    
    # Retrieve from multiple servers for reconstruction
    servers = [
        "https://server1.neuralock.io",
        "https://server2.neuralock.io",
        "https://server3.neuralock.io"
    ]
    
    all_shares = client.retrieve_all_shares(
        contract_address="0x1234567890abcdef1234567890abcdef12345678",
        object_id="token_123",
        servers=servers
    )
    
    print(f"\nRetrieved {len(all_shares)} shares")
    
    # Reconstruct secret if we have enough shares
    if len(all_shares) >= 2:  # Assuming threshold is 2
        share_bytes = [s["share"] for s in all_shares[:2]]
        reconstructed_secret = reconstruct_secret(share_bytes)
        print(f"Reconstructed secret: {reconstructed_secret.decode()}")
    else:
        print("Not enough shares to reconstruct secret")