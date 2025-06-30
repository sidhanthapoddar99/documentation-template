async function registerInitialServers(registry, servers) {
  console.log("Registering initial servers...");
  
  for (const server of servers) {
    const metadata = {
      serverPublicKey: server.publicKey,
      encryptionPublicKey: server.encryptionKey,
      domain: server.domain,
      verified: false,
      registeredAt: 0,
      lastUpdated: 0,
      registeredBy: "0x0000000000000000000000000000000000000000"
    };
    
    const tx = await registry.mintServer(server.operator, metadata);
    const tokenId = tx.logs[0].args.tokenId;
    
    console.log(`✓ Server NFT minted: #${tokenId} for ${server.domain}`);
  }
}