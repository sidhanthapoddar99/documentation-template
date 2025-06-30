// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/INeuralock.sol";

contract TimeLockVault is INeuralock {
    struct TimeLock {
        address owner;
        string description;
        uint256 globalUnlockTime;      // Default unlock time for all
        mapping(address => uint256) userUnlockTime;  // Custom unlock per user
        mapping(address => bool) hasCustomTime;
        bool exists;
        uint256 createdAt;
    }
    
    mapping(bytes32 => TimeLock) public timeLocks;
    
    // Events
    event TimeLockCreated(
        bytes32 indexed objectId, 
        address indexed owner, 
        uint256 unlockTime
    );
    event UnlockTimeUpdated(
        bytes32 indexed objectId, 
        address indexed user, 
        uint256 newUnlockTime
    );
    event TimeLockDeleted(bytes32 indexed objectId);
    
    /**
     * @dev Implementation of INeuralock interface
     */
    function neuralock(address user, bytes32 objectId) 
        external 
        view 
        returns (uint8) 
    {
        TimeLock storage lock = timeLocks[objectId];
        
        // Non-existent objects have no access
        if (!lock.exists) {
            return 0;
        }
        
        // Owner always has full access
        if (user == lock.owner) {
            return 3;
        }
        
        // Check unlock time
        uint256 unlockTime = lock.hasCustomTime[user] 
            ? lock.userUnlockTime[user] 
            : lock.globalUnlockTime;
        
        if (block.timestamp >= unlockTime) {
            return 1; // Read access after unlock
        }
        
        return 0; // No access before unlock
    }
    
    function neuralockVersion() external pure returns (uint256) {
        return 1;
    }
    
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
    
    // Time Lock Management
    
    function createTimeLock(
        bytes32 objectId,
        uint256 unlockTime,
        string memory description
    ) external {
        require(!timeLocks[objectId].exists, "Time lock already exists");
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        
        TimeLock storage lock = timeLocks[objectId];
        lock.owner = msg.sender;
        lock.description = description;
        lock.globalUnlockTime = unlockTime;
        lock.exists = true;
        lock.createdAt = block.timestamp;
        
        emit TimeLockCreated(objectId, msg.sender, unlockTime);
    }
    
    function setUserUnlockTime(
        bytes32 objectId,
        address user,
        uint256 unlockTime
    ) external {
        TimeLock storage lock = timeLocks[objectId];
        require(lock.exists, "Time lock does not exist");
        require(lock.owner == msg.sender, "Not the owner");
        require(user != address(0), "Invalid user");
        
        lock.userUnlockTime[user] = unlockTime;
        lock.hasCustomTime[user] = true;
        
        emit UnlockTimeUpdated(objectId, user, unlockTime);
    }
    
    function setGlobalUnlockTime(
        bytes32 objectId,
        uint256 newUnlockTime
    ) external {
        TimeLock storage lock = timeLocks[objectId];
        require(lock.exists, "Time lock does not exist");
        require(lock.owner == msg.sender, "Not the owner");
        
        lock.globalUnlockTime = newUnlockTime;
        
        emit UnlockTimeUpdated(objectId, address(0), newUnlockTime);
    }
    
    function deleteTimeLock(bytes32 objectId) external {
        TimeLock storage lock = timeLocks[objectId];
        require(lock.exists, "Time lock does not exist");
        require(lock.owner == msg.sender, "Not the owner");
        
        delete timeLocks[objectId];
        
        emit TimeLockDeleted(objectId);
    }
    
    // View Functions
    
    function getTimeLock(bytes32 objectId) 
        external 
        view 
        returns (
            address owner,
            string memory description,
            uint256 globalUnlockTime,
            uint256 createdAt
        ) 
    {
        TimeLock storage lock = timeLocks[objectId];
        require(lock.exists, "Time lock does not exist");
        
        return (
            lock.owner,
            lock.description,
            lock.globalUnlockTime,
            lock.createdAt
        );
    }
    
    function getUserUnlockTime(bytes32 objectId, address user) 
        external 
        view 
        returns (uint256) 
    {
        TimeLock storage lock = timeLocks[objectId];
        require(lock.exists, "Time lock does not exist");
        
        if (lock.hasCustomTime[user]) {
            return lock.userUnlockTime[user];
        }
        
        return lock.globalUnlockTime;
    }
    
    function timeUntilUnlock(bytes32 objectId, address user) 
        external 
        view 
        returns (uint256) 
    {
        TimeLock storage lock = timeLocks[objectId];
        if (!lock.exists) {
            return type(uint256).max; // Never unlocks
        }
        
        uint256 unlockTime = lock.hasCustomTime[user] 
            ? lock.userUnlockTime[user] 
            : lock.globalUnlockTime;
        
        if (block.timestamp >= unlockTime) {
            return 0; // Already unlocked
        }
        
        return unlockTime - block.timestamp;
    }
    
    // Batch operations
    
    function createMultipleTimeLocks(
        bytes32[] calldata objectIds,
        uint256[] calldata unlockTimes,
        string[] calldata descriptions
    ) external {
        require(
            objectIds.length == unlockTimes.length && 
            objectIds.length == descriptions.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < objectIds.length; i++) {
            if (!timeLocks[objectIds[i]].exists) {
                TimeLock storage lock = timeLocks[objectIds[i]];
                lock.owner = msg.sender;
                lock.description = descriptions[i];
                lock.globalUnlockTime = unlockTimes[i];
                lock.exists = true;
                lock.createdAt = block.timestamp;
                
                emit TimeLockCreated(objectIds[i], msg.sender, unlockTimes[i]);
            }
        }
    }
}