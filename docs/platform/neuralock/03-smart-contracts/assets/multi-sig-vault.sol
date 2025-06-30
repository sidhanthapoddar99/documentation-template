// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/INeuralock.sol";

contract MultiSigVault is INeuralock {
    // Signers and thresholds
    mapping(address => bool) public signers;
    uint256 public signersCount;
    uint256 public threshold;
    
    // Data objects with access control
    struct DataObject {
        address creator;
        string description;
        uint256 requiredSigners;
        mapping(address => bool) hasAccess;
        mapping(address => uint8) accessLevel;
        bool exists;
        uint256 createdAt;
    }
    
    mapping(bytes32 => DataObject) public objects;
    
    // Proposals for access changes
    struct Proposal {
        bytes32 objectId;
        address target;
        uint8 newAccessLevel;
        uint256 approvals;
        mapping(address => bool) hasApproved;
        bool executed;
        uint256 createdAt;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Events
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ObjectCreated(bytes32 indexed objectId, address indexed creator);
    event ProposalCreated(uint256 indexed proposalId, bytes32 objectId, address target);
    event ProposalApproved(uint256 indexed proposalId, address indexed approver);
    event ProposalExecuted(uint256 indexed proposalId);
    event AccessUpdated(bytes32 indexed objectId, address indexed user, uint8 level);
    
    modifier onlySigner() {
        require(signers[msg.sender], "Not a signer");
        _;
    }
    
    constructor(address[] memory _signers, uint256 _threshold) {
        require(_signers.length >= _threshold, "Invalid threshold");
        require(_threshold > 0, "Threshold must be > 0");
        
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer");
            require(!signers[_signers[i]], "Duplicate signer");
            
            signers[_signers[i]] = true;
            emit SignerAdded(_signers[i]);
        }
        
        signersCount = _signers.length;
        threshold = _threshold;
    }
    
    /**
     * @dev Implementation of INeuralock interface
     */
    function neuralock(address user, bytes32 objectId) 
        external 
        view 
        returns (uint8) 
    {
        DataObject storage obj = objects[objectId];
        
        // Non-existent objects have no access
        if (!obj.exists) {
            return 0;
        }
        
        // Creator always has full access
        if (obj.creator == user) {
            return 3;
        }
        
        // Signers have their assigned access level
        if (signers[user] && obj.hasAccess[user]) {
            return obj.accessLevel[user];
        }
        
        // Check explicit access grants
        if (obj.hasAccess[user]) {
            return obj.accessLevel[user];
        }
        
        return 0; // No access by default
    }
    
    function neuralockVersion() external pure returns (uint256) {
        return 1;
    }
    
    // Multi-Sig Management
    
    function addSigner(address signer) external onlySigner {
        require(!signers[signer], "Already a signer");
        require(signer != address(0), "Invalid address");
        
        // This itself should go through multi-sig proposal
        signers[signer] = true;
        signersCount++;
        
        emit SignerAdded(signer);
    }
    
    // Data Management
    
    function createDataObject(
        bytes32 objectId,
        string memory description,
        uint256 requiredSigners
    ) external onlySigner {
        require(!objects[objectId].exists, "Object already exists");
        require(requiredSigners <= signersCount, "Too many required signers");
        
        DataObject storage obj = objects[objectId];
        obj.creator = msg.sender;
        obj.description = description;
        obj.requiredSigners = requiredSigners;
        obj.exists = true;
        obj.createdAt = block.timestamp;
        
        // Creator gets full access
        obj.hasAccess[msg.sender] = true;
        obj.accessLevel[msg.sender] = 3;
        
        emit ObjectCreated(objectId, msg.sender);
    }
    
    // Proposal System
    
    function proposeAccessChange(
        bytes32 objectId,
        address target,
        uint8 newAccessLevel
    ) external onlySigner returns (uint256) {
        require(objects[objectId].exists, "Object does not exist");
        require(newAccessLevel <= 3, "Invalid access level");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.objectId = objectId;
        proposal.target = target;
        proposal.newAccessLevel = newAccessLevel;
        proposal.createdAt = block.timestamp;
        
        emit ProposalCreated(proposalId, objectId, target);
        
        // Auto-approve by proposer
        _approveProposal(proposalId);
        
        return proposalId;
    }
    
    function approveProposal(uint256 proposalId) external onlySigner {
        _approveProposal(proposalId);
    }
    
    function _approveProposal(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.createdAt > 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.hasApproved[msg.sender], "Already approved");
        
        proposal.hasApproved[msg.sender] = true;
        proposal.approvals++;
        
        emit ProposalApproved(proposalId, msg.sender);
        
        // Execute if threshold reached
        DataObject storage obj = objects[proposal.objectId];
        uint256 required = obj.requiredSigners > 0 ? obj.requiredSigners : threshold;
        
        if (proposal.approvals >= required) {
            _executeProposal(proposalId);
        }
    }
    
    function _executeProposal(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        DataObject storage obj = objects[proposal.objectId];
        
        if (proposal.newAccessLevel > 0) {
            obj.hasAccess[proposal.target] = true;
            obj.accessLevel[proposal.target] = proposal.newAccessLevel;
        } else {
            // Revoke access
            obj.hasAccess[proposal.target] = false;
            obj.accessLevel[proposal.target] = 0;
        }
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
        emit AccessUpdated(proposal.objectId, proposal.target, proposal.newAccessLevel);
    }
    
    // View Functions
    
    function getObjectAccess(bytes32 objectId, address user) 
        external 
        view 
        returns (bool hasAccess, uint8 level) 
    {
        DataObject storage obj = objects[objectId];
        return (obj.hasAccess[user], obj.accessLevel[user]);
    }
    
    function getProposalDetails(uint256 proposalId) 
        external 
        view 
        returns (
            bytes32 objectId,
            address target,
            uint8 newAccessLevel,
            uint256 approvals,
            bool executed
        ) 
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.objectId,
            proposal.target,
            proposal.newAccessLevel,
            proposal.approvals,
            proposal.executed
        );
    }
}