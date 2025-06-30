// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INeuralock.sol";

contract SimpleNFTVault is ERC721, INeuralock, Ownable {
    // Track which NFTs have associated encrypted data
    mapping(uint256 => bool) public hasEncryptedData;
    mapping(uint256 => address) public dataCreator;
    
    // Shared access permissions
    mapping(uint256 => mapping(address => uint8)) public sharedAccess;
    
    // Events
    event DataCreated(uint256 indexed tokenId, address indexed creator);
    event AccessGranted(uint256 indexed tokenId, address indexed user, uint8 level);
    event AccessRevoked(uint256 indexed tokenId, address indexed user);
    
    constructor() ERC721("Neuralock NFT Vault", "NLV") {}
    
    /**
     * @dev Implementation of INeuralock interface
     */
    function neuralock(address user, bytes32 objectId) 
        external 
        view 
        returns (uint8) 
    {
        // Convert objectId to tokenId
        uint256 tokenId = uint256(objectId);
        
        // Check if token exists
        if (!_exists(tokenId)) {
            return 0; // No access for non-existent tokens
        }
        
        // Owner has full access
        address tokenOwner = ownerOf(tokenId);
        if (user == tokenOwner) {
            return 3; // Read and Write
        }
        
        // Check shared access
        uint8 sharedLevel = sharedAccess[tokenId][user];
        if (sharedLevel > 0) {
            return sharedLevel;
        }
        
        // Check if user has been approved for this token
        if (getApproved(tokenId) == user) {
            return 1; // Read only for approved addresses
        }
        
        // Check if user is approved for all tokens
        if (isApprovedForAll(tokenOwner, user)) {
            return 1; // Read only for operators
        }
        
        return 0; // No access by default
    }
    
    /**
     * @dev Optional: Interface version
     */
    function neuralockVersion() external pure returns (uint256) {
        return 1; // Version 1.0.0
    }
    
    /**
     * @dev Optional: Batch permission check
     */
    function neuralockBatch(address user, bytes32[] calldata objectIds) 
        external 
        view 
        returns (uint8[] memory) 
    {
        uint8[] memory permissions = new uint8[](objectIds.length);
        
        for (uint256 i = 0; i < objectIds.length; i++) {
            permissions[i] = this.neuralock(user, objectIds[i]);
        }
        
        return permissions;
    }
    
    // NFT Management Functions
    
    function mint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }
    
    function createEncryptedData(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!hasEncryptedData[tokenId], "Data already exists");
        
        hasEncryptedData[tokenId] = true;
        dataCreator[tokenId] = msg.sender;
        
        emit DataCreated(tokenId, msg.sender);
    }
    
    // Access Management Functions
    
    function grantAccess(
        uint256 tokenId, 
        address user, 
        bool canRead, 
        bool canWrite
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(user != address(0), "Invalid user");
        require(user != msg.sender, "Cannot grant to self");
        
        uint8 level = 0;
        if (canRead && canWrite) {
            level = 3;
        } else if (canWrite) {
            level = 2;
        } else if (canRead) {
            level = 1;
        }
        
        sharedAccess[tokenId][user] = level;
        
        if (level > 0) {
            emit AccessGranted(tokenId, user, level);
        } else {
            emit AccessRevoked(tokenId, user);
        }
    }
    
    function revokeAccess(uint256 tokenId, address user) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        delete sharedAccess[tokenId][user];
        emit AccessRevoked(tokenId, user);
    }
    
    // View Functions
    
    function getAccessLevel(uint256 tokenId, address user) 
        external 
        view 
        returns (uint8) 
    {
        return this.neuralock(user, bytes32(tokenId));
    }
    
    // Internal function to check token existence
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}