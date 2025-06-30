function mintServer(address to, ServerMetadata memory metadata) 
    external 
    onlyManager 
    validServerMetadata(metadata)
    returns (uint256) 
{
    // Ensure server key is unique
    require(
        serverKeyToTokenId[metadata.serverPublicKey] == 0, 
        "Server already registered"
    );
    
    // Increment token counter
    totalServers++;
    uint256 tokenId = totalServers;
    
    // Set metadata (unverified by default)
    metadata.verified = false;
    metadata.registeredAt = block.timestamp;
    metadata.lastUpdated = block.timestamp;
    metadata.registeredBy = msg.sender;
    
    // Store server metadata
    serverMetadata[tokenId] = metadata;
    
    // Create reverse mapping for efficient lookups
    serverKeyToTokenId[metadata.serverPublicKey] = tokenId;
    
    // Mint NFT to the specified address
    _safeMint(to, tokenId);
    
    emit ServerMinted(tokenId, to, metadata.serverPublicKey);
    
    return tokenId;
}