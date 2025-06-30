from neuralock import NeuralockClient
from web3 import Web3

# Initialize the client
client = NeuralockClient(
    application_contract="0x1234567890abcdef...",
    private_key="0xabcdef1234567890...",  # Your private key
    servers=[
        {"nft_id": 1},
        {"nft_id": 2},
        {"nft_id": 3}
    ],
    web3_provider="https://mainnet.infura.io/v3/YOUR_KEY"
)

# Initialize session
client.initialize()

# Encrypt data
sensitive_data = "This is confidential information"
encrypted = client.encrypt(
    data=sensitive_data,
    object_id="document-123"
)

print(f"Encrypted: {encrypted.ciphertext[:50]}...")
print(f"Stored on servers: {encrypted.metadata['servers']}")

# Decrypt data
decrypted = client.decrypt(
    encrypted_data=encrypted,
    object_id="document-123"
)

print(f"Decrypted: {decrypted}")

# Update permissions (optional)
client.update_permissions(
    object_id="document-123",
    permissions={
        "read": ["0xuser1...", "0xuser2..."],
        "write": ["0xuser1..."]
    }
)