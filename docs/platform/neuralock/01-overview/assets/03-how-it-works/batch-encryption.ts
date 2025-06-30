// Batch encryption example
async function batchEncrypt(items, appContract) {
  // Generate a batch session
  const batchSession = await client.createBatchSession();
  
  // Process all items in parallel
  const results = await Promise.all(
    items.map(item => 
      client.encrypt(
        item.data,
        appContract,
        item.objectId,
        { session: batchSession }
      )
    )
  );
  
  return results;
}