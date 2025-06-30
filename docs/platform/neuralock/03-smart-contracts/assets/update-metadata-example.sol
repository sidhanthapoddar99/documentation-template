// Step 1: NFT owner requests metadata update
function updateMetadata(uint256 tokenId, ServerMetadata memory newMetadata) 
    external 
    validServerMetadata(newMetadata)
    returns (uint256 requestId) 
{
    require(ownerOf(tokenId) == msg.sender, "Not the NFT owner");
    
    // Create verification request
    requestId = ++totalVerificationRequests;
    
    VerificationRequest storage request = pendingVerifications[requestId];
    request.tokenId = tokenId;
    request.proposedMetadata = newMetadata;
    request.proposer = msg.sender;
    request.createdAt = block.timestamp;
    request.approvals = 0;
    request.executed = false;
    
    // Reset verification status
    verifiedServers[tokenId] = false;
    
    emit MetadataUpdateRequested(tokenId, msg.sender);
    
    return requestId;
}

// Step 2: Managers approve the update
function approveMetadataUpdate(uint256 requestId) external onlyManager {
    VerificationRequest storage request = pendingVerifications[requestId];
    
    require(!request.executed, "Request already executed");
    require(request.createdAt > 0, "Request does not exist");
    require(!request.hasApproved[msg.sender], "Already approved");
    require(
        block.timestamp <= request.createdAt + VERIFICATION_TIMEOUT,
        "Request expired"
    );
    
    // Record approval
    request.hasApproved[msg.sender] = true;
    request.approvals++;
    
    emit MetadataUpdateApproved(requestId, msg.sender);
    
    // Execute if threshold met
    if (request.approvals >= verificationThreshold) {
        _executeMetadataUpdate(requestId);
    }
}

// Internal: Execute the approved update
function _executeMetadataUpdate(uint256 requestId) internal {
    VerificationRequest storage request = pendingVerifications[requestId];
    uint256 tokenId = request.tokenId;
    
    // Store old key for event
    bytes32 oldKey = serverMetadata[tokenId].serverPublicKey;
    
    // Update mappings if key changed
    if (oldKey != request.proposedMetadata.serverPublicKey) {
        delete serverKeyToTokenId[oldKey];
        serverKeyToTokenId[request.proposedMetadata.serverPublicKey] = tokenId;
    }
    
    // Update metadata
    request.proposedMetadata.lastUpdated = block.timestamp;
    request.proposedMetadata.verified = true;
    serverMetadata[tokenId] = request.proposedMetadata;
    verifiedServers[tokenId] = true;
    
    // Mark as executed
    request.executed = true;
    
    emit MetadataUpdated(tokenId, oldKey, request.proposedMetadata.serverPublicKey);
    emit ServerVerified(tokenId, msg.sender);
}