// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract NeuralockAccessControl {
    // Role constants
    uint8 public constant OWNER_ROLE = 1;
    uint8 public constant ADMIN_ROLE = 2;
    uint8 public constant MANAGER_ROLE = 3;
    
    // Minimum owners to prevent lockout
    uint256 public constant MIN_OWNERS = 1;
    
    // Role storage
    mapping(address => Role) public roles;
    uint256 public totalOwners;
    uint256 public totalAdmins;
    uint256 public totalManagers;
    
    // Owner Management
    function addOwner(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(!roles[account].isOwner, "Already an owner");
        
        roles[account].isOwner = true;
        roles[account].assignedAt = block.timestamp;
        roles[account].assignedBy = msg.sender;
        
        totalOwners++;
        
        emit OwnerAdded(account, msg.sender);
    }
    
    function removeOwner(address account) external onlyOwner {
        require(roles[account].isOwner, "Not an owner");
        require(account != msg.sender, "Cannot remove self");
        require(totalOwners > MIN_OWNERS, "Cannot remove last owner");
        
        // Clear all roles
        bool wasAdmin = roles[account].isAdmin;
        bool wasManager = roles[account].isManager;
        
        delete roles[account];
        totalOwners--;
        
        // Update counters
        if (wasAdmin) totalAdmins--;
        if (wasManager) totalManagers--;
        
        emit OwnerRemoved(account, msg.sender);
    }
    
    // Admin Management
    function addAdmin(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(!roles[account].isAdmin, "Already an admin");
        
        roles[account].isAdmin = true;
        
        // Preserve existing roles
        if (roles[account].assignedAt == 0) {
            roles[account].assignedAt = block.timestamp;
            roles[account].assignedBy = msg.sender;
        }
        
        totalAdmins++;
        
        emit AdminAdded(account, msg.sender);
    }
    
    function removeAdmin(address account) external onlyOwner {
        require(roles[account].isAdmin, "Not an admin");
        
        roles[account].isAdmin = false;
        totalAdmins--;
        
        // Remove completely if no other roles
        if (!roles[account].isOwner && !roles[account].isManager) {
            delete roles[account];
        }
        
        emit AdminRemoved(account, msg.sender);
    }
    
    // Manager Management
    function addManager(address account) external onlyAdmin {
        require(account != address(0), "Invalid address");
        require(!roles[account].isManager, "Already a manager");
        
        roles[account].isManager = true;
        
        // Preserve existing roles
        if (roles[account].assignedAt == 0) {
            roles[account].assignedAt = block.timestamp;
            roles[account].assignedBy = msg.sender;
        }
        
        totalManagers++;
        
        emit ManagerAdded(account, msg.sender);
    }
    
    function removeManager(address account) external onlyAdmin {
        require(roles[account].isManager, "Not a manager");
        
        roles[account].isManager = false;
        totalManagers--;
        
        // Remove completely if no other roles
        if (!roles[account].isOwner && !roles[account].isAdmin) {
            delete roles[account];
        }
        
        emit ManagerRemoved(account, msg.sender);
    }
    
    // Batch Operations for Gas Efficiency
    function addManagers(address[] calldata accounts) external onlyAdmin {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (!roles[accounts[i]].isManager && accounts[i] != address(0)) {
                roles[accounts[i]].isManager = true;
                
                if (roles[accounts[i]].assignedAt == 0) {
                    roles[accounts[i]].assignedAt = block.timestamp;
                    roles[accounts[i]].assignedBy = msg.sender;
                }
                
                totalManagers++;
                emit ManagerAdded(accounts[i], msg.sender);
            }
        }
    }
    
    // Role Checking Functions
    function hasRole(address account, uint8 role) public view returns (bool) {
        if (role == OWNER_ROLE) {
            return roles[account].isOwner;
        } else if (role == ADMIN_ROLE) {
            return roles[account].isOwner || roles[account].isAdmin;
        } else if (role == MANAGER_ROLE) {
            return roles[account].isOwner || 
                   roles[account].isAdmin || 
                   roles[account].isManager;
        }
        return false;
    }
    
    function getRoles(address account) external view returns (
        bool isOwner,
        bool isAdmin,
        bool isManager,
        uint256 assignedAt,
        address assignedBy
    ) {
        Role memory role = roles[account];
        return (
            role.isOwner,
            role.isAdmin,
            role.isManager,
            role.assignedAt,
            role.assignedBy
        );
    }
}