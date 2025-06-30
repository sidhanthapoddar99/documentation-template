import asyncio
from neuralock import NeuralockClient

async def main():
    # Create async client
    client = NeuralockClient(
        application_contract="0x1234...",
        private_key="0xabcd...",
        servers=[
            {"nft_id": 1},
            {"nft_id": 2},
            {"nft_id": 3}
        ],
        web3_provider="wss://mainnet.infura.io/ws/v3/YOUR_KEY",
        async_mode=True  # Enable async mode
    )
    
    # Initialize asynchronously
    await client.ainitialize()
    
    # Concurrent encryption operations
    tasks = []
    for i in range(10):
        task = client.aencrypt(
            data=f"Secret document {i}",
            object_id=f"doc-{i}"
        )
        tasks.append(task)
    
    # Wait for all encryptions to complete
    encrypted_results = await asyncio.gather(*tasks)
    
    print(f"Encrypted {len(encrypted_results)} documents")
    
    # Concurrent decryption
    decrypt_tasks = []
    for i, encrypted in enumerate(encrypted_results):
        task = client.adecrypt(
            encrypted_data=encrypted,
            object_id=f"doc-{i}"
        )
        decrypt_tasks.append(task)
    
    decrypted_results = await asyncio.gather(*decrypt_tasks)
    
    for i, decrypted in enumerate(decrypted_results):
        print(f"Document {i}: {decrypted}")
    
    # Clean up
    await client.aclose()

# Run the async function
asyncio.run(main())