from neuralock import NeuralockClient
import asyncio
from typing import List, Tuple
import time

# Initialize client
client = NeuralockClient(
    application_contract="0x1234...",
    private_key="0xabcd...",
    servers=[{"nft_id": 1}, {"nft_id": 2}, {"nft_id": 3}],
    web3_provider="https://mainnet.infura.io/v3/YOUR_KEY"
)

# Synchronous batch operations
def sync_batch_example():
    client.initialize()
    
    # Prepare documents for encryption
    documents = [
        ("Patient record 001", "patient-001"),
        ("Patient record 002", "patient-002"),
        ("Patient record 003", "patient-003"),
        # ... up to hundreds of documents
    ]
    
    # Batch encrypt
    start_time = time.time()
    encrypted_results = client.batch_encrypt(documents)
    encrypt_time = time.time() - start_time
    
    print(f"Encrypted {len(encrypted_results)} documents in {encrypt_time:.2f}s")
    print(f"Average: {encrypt_time/len(documents):.3f}s per document")
    
    # Batch decrypt
    decrypt_items = [
        (encrypted, doc_id)
        for encrypted, (_, doc_id) in zip(encrypted_results, documents)
    ]
    
    start_time = time.time()
    decrypted_results = client.batch_decrypt(decrypt_items)
    decrypt_time = time.time() - start_time
    
    print(f"Decrypted {len(decrypted_results)} documents in {decrypt_time:.2f}s")
    
    # Verify results
    for original, decrypted in zip(documents, decrypted_results):
        assert original[0] == decrypted, "Decryption mismatch!"

# Asynchronous batch operations with concurrency control
async def async_batch_example():
    # Initialize async client
    async_client = NeuralockClient(
        application_contract="0x1234...",
        private_key="0xabcd...",
        servers=[{"nft_id": 1}, {"nft_id": 2}, {"nft_id": 3}],
        web3_provider="wss://mainnet.infura.io/ws/v3/YOUR_KEY",
        async_mode=True
    )
    
    await async_client.ainitialize()
    
    # Large dataset
    large_dataset = [
        (f"Document content {i}", f"doc-{i}")
        for i in range(1000)
    ]
    
    # Process in chunks to avoid overwhelming the system
    chunk_size = 50
    all_encrypted = []
    
    print(f"Processing {len(large_dataset)} documents in chunks of {chunk_size}")
    
    for i in range(0, len(large_dataset), chunk_size):
        chunk = large_dataset[i:i + chunk_size]
        
        # Encrypt chunk
        start_time = time.time()
        encrypted_chunk = await async_client.abatch_encrypt(chunk)
        chunk_time = time.time() - start_time
        
        all_encrypted.extend(encrypted_chunk)
        print(f"Chunk {i//chunk_size + 1}: {len(encrypted_chunk)} documents in {chunk_time:.2f}s")
    
    print(f"Total encrypted: {len(all_encrypted)} documents")
    
    # Cleanup
    await async_client.aclose()

# Advanced batch operations with error handling
class BatchProcessor:
    def __init__(self, client: NeuralockClient):
        self.client = client
        self.failed_items = []
        self.successful_items = []
    
    def process_with_retry(self, items: List[Tuple[str, str]], max_retries: int = 3):
        """Process items with automatic retry for failures"""
        remaining_items = items.copy()
        attempt = 0
        
        while remaining_items and attempt < max_retries:
            attempt += 1
            print(f"Attempt {attempt}: Processing {len(remaining_items)} items")
            
            try:
                results = self.client.batch_encrypt(remaining_items)
                
                # All successful
                self.successful_items.extend(zip(remaining_items, results))
                remaining_items = []
                
            except Exception as e:
                print(f"Batch operation failed: {e}")
                
                # Try items individually to identify failures
                newly_failed = []
                for item in remaining_items:
                    try:
                        result = self.client.encrypt(item[0], item[1])
                        self.successful_items.append((item, result))
                    except Exception as item_error:
                        print(f"Failed to encrypt {item[1]}: {item_error}")
                        newly_failed.append(item)
                
                remaining_items = newly_failed
        
        # Record final failures
        self.failed_items.extend(remaining_items)
        
        return {
            "successful": len(self.successful_items),
            "failed": len(self.failed_items),
            "failed_items": self.failed_items
        }

# Streaming batch operations for very large datasets
class StreamingBatchProcessor:
    def __init__(self, client: NeuralockClient, chunk_size: int = 100):
        self.client = client
        self.chunk_size = chunk_size
    
    def process_file(self, input_file: str, output_file: str):
        """Process large file line by line"""
        self.client.initialize()
        
        with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
            buffer = []
            line_number = 0
            
            for line in infile:
                line_number += 1
                content = line.strip()
                object_id = f"line-{line_number}"
                buffer.append((content, object_id))
                
                # Process buffer when full
                if len(buffer) >= self.chunk_size:
                    encrypted_batch = self.client.batch_encrypt(buffer)
                    
                    # Write results
                    for (_, obj_id), encrypted in zip(buffer, encrypted_batch):
                        outfile.write(f"{obj_id}|{encrypted.ciphertext}\n")
                    
                    buffer = []
            
            # Process remaining items
            if buffer:
                encrypted_batch = self.client.batch_encrypt(buffer)
                for (_, obj_id), encrypted in zip(buffer, encrypted_batch):
                    outfile.write(f"{obj_id}|{encrypted.ciphertext}\n")

# Example usage
if __name__ == "__main__":
    # Run synchronous example
    sync_batch_example()
    
    # Run asynchronous example
    asyncio.run(async_batch_example())
    
    # Advanced batch processing with retry
    processor = BatchProcessor(client)
    items = [("data", f"id-{i}") for i in range(100)]
    results = processor.process_with_retry(items)
    print(f"Batch processing results: {results}")
    
    # Streaming for large files
    streamer = StreamingBatchProcessor(client)
    streamer.process_file("large_dataset.txt", "encrypted_output.txt")