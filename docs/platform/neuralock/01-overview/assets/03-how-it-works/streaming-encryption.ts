// Stream encryption for large files
async function* encryptStream(fileStream, appContract, objectId) {
  const aesKey = await generateAESKey();
  const cipher = new StreamCipher(aesKey);
  
  // Encrypt chunks
  for await (const chunk of fileStream) {
    yield cipher.update(chunk);
  }
  
  // Finalize and distribute key
  const finalBlock = cipher.final();
  const shares = await distributeKey(aesKey, servers);
  
  yield {
    type: 'final',
    data: finalBlock,
    shares: shares
  };
}