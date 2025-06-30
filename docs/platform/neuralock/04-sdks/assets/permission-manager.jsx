import React, { useState, useEffect } from 'react';
import { useNeuralockPermissions } from '@neuralock/react';
import { isAddress } from 'ethers/lib/utils';

function PermissionManager({ objectId }) {
  const {
    permissions,
    updatePermissions,
    revokeAccess,
    checkPermission,
    isUpdating,
    error
  } = useNeuralockPermissions(objectId);

  const [newAddress, setNewAddress] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState({
    read: true,
    write: false,
    admin: false
  });
  const [userList, setUserList] = useState([]);

  // Load current permissions
  useEffect(() => {
    if (permissions) {
      const users = Object.entries(permissions).map(([address, perms]) => ({
        address,
        permissions: perms
      }));
      setUserList(users);
    }
  }, [permissions]);

  // Add new user
  const handleAddUser = async () => {
    if (!isAddress(newAddress)) {
      alert('Invalid Ethereum address');
      return;
    }

    const perms = Object.keys(selectedPermissions)
      .filter(key => selectedPermissions[key]);

    if (perms.length === 0) {
      alert('Please select at least one permission');
      return;
    }

    try {
      await updatePermissions({
        add: { [newAddress]: perms }
      });

      // Reset form
      setNewAddress('');
      setSelectedPermissions({
        read: true,
        write: false,
        admin: false
      });

      alert('User added successfully');
    } catch (err) {
      console.error('Failed to add user:', err);
      alert('Failed to add user');
    }
  };

  // Remove user
  const handleRemoveUser = async (address) => {
    if (!confirm(`Remove access for ${address}?`)) return;

    try {
      await updatePermissions({
        remove: [address]
      });
      alert('User removed successfully');
    } catch (err) {
      console.error('Failed to remove user:', err);
      alert('Failed to remove user');
    }
  };

  // Update user permissions
  const handleUpdateUserPermissions = async (address, newPerms) => {
    try {
      await updatePermissions({
        add: { [address]: newPerms }
      });
      alert('Permissions updated successfully');
    } catch (err) {
      console.error('Failed to update permissions:', err);
      alert('Failed to update permissions');
    }
  };

  // Revoke all access
  const handleRevokeAll = async () => {
    if (!confirm('This will permanently revoke all access to this object. Continue?')) {
      return;
    }

    try {
      await revokeAccess();
      alert('All access revoked successfully');
    } catch (err) {
      console.error('Failed to revoke access:', err);
      alert('Failed to revoke access');
    }
  };

  return (
    <div className="permission-manager">
      <h3>Permission Manager</h3>
      <p className="object-id">Object ID: <code>{objectId}</code></p>

      {/* Add New User Section */}
      <div className="add-user-section">
        <h4>Add New User</h4>
        <div className="add-user-form">
          <input
            type="text"
            placeholder="0x... (Ethereum address)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="address-input"
          />
          
          <div className="permission-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.read}
                onChange={(e) => setSelectedPermissions({
                  ...selectedPermissions,
                  read: e.target.checked
                })}
              />
              Read
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.write}
                onChange={(e) => setSelectedPermissions({
                  ...selectedPermissions,
                  write: e.target.checked
                })}
              />
              Write
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.admin}
                onChange={(e) => setSelectedPermissions({
                  ...selectedPermissions,
                  admin: e.target.checked
                })}
              />
              Admin
            </label>
          </div>
          
          <button
            onClick={handleAddUser}
            disabled={isUpdating || !newAddress}
            className="add-button"
          >
            {isUpdating ? 'Adding...' : 'Add User'}
          </button>
        </div>
      </div>

      {/* Current Users Section */}
      <div className="current-users-section">
        <h4>Current Users ({userList.length})</h4>
        
        {userList.length === 0 ? (
          <p className="no-users">No users have access to this object</p>
        ) : (
          <div className="user-list">
            {userList.map((user) => (
              <UserPermissionRow
                key={user.address}
                user={user}
                onUpdate={handleUpdateUserPermissions}
                onRemove={handleRemoveUser}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="danger-zone">
        <h4>Danger Zone</h4>
        <p>Irreversible actions:</p>
        <button
          onClick={handleRevokeAll}
          disabled={isUpdating}
          className="revoke-button"
        >
          {isUpdating ? 'Revoking...' : 'Revoke All Access'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}

      <style jsx>{`
        .permission-manager {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .object-id {
          color: #666;
          margin-bottom: 20px;
        }

        .object-id code {
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .add-user-section,
        .current-users-section,
        .danger-zone {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .add-user-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .address-input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .permission-checkboxes {
          display: flex;
          gap: 20px;
        }

        .permission-checkboxes label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .add-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .no-users {
          color: #666;
          font-style: italic;
        }

        .user-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .danger-zone {
          background: #ffebee;
          border: 1px solid #ffcdd2;
        }

        .revoke-button {
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        .revoke-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #d32f2f;
          margin-top: 16px;
          padding: 12px;
          background: #ffebee;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

// User permission row component
function UserPermissionRow({ user, onUpdate, onRemove, isUpdating }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPerms, setEditedPerms] = useState({
    read: user.permissions.includes('read'),
    write: user.permissions.includes('write'),
    admin: user.permissions.includes('admin')
  });

  const handleSave = () => {
    const newPerms = Object.keys(editedPerms)
      .filter(key => editedPerms[key]);
    
    onUpdate(user.address, newPerms);
    setIsEditing(false);
  };

  return (
    <div className="user-row">
      <div className="user-address">
        {user.address.substring(0, 6)}...{user.address.substring(38)}
      </div>
      
      {isEditing ? (
        <>
          <div className="permission-edit">
            <label>
              <input
                type="checkbox"
                checked={editedPerms.read}
                onChange={(e) => setEditedPerms({
                  ...editedPerms,
                  read: e.target.checked
                })}
              />
              Read
            </label>
            <label>
              <input
                type="checkbox"
                checked={editedPerms.write}
                onChange={(e) => setEditedPerms({
                  ...editedPerms,
                  write: e.target.checked
                })}
              />
              Write
            </label>
            <label>
              <input
                type="checkbox"
                checked={editedPerms.admin}
                onChange={(e) => setEditedPerms({
                  ...editedPerms,
                  admin: e.target.checked
                })}
              />
              Admin
            </label>
          </div>
          <div className="user-actions">
            <button onClick={handleSave} disabled={isUpdating}>
              Save
            </button>
            <button onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="permission-badges">
            {user.permissions.map(perm => (
              <span key={perm} className={`badge ${perm}`}>
                {perm}
              </span>
            ))}
          </div>
          <div className="user-actions">
            <button onClick={() => setIsEditing(true)} disabled={isUpdating}>
              Edit
            </button>
            <button 
              onClick={() => onRemove(user.address)} 
              disabled={isUpdating}
              className="remove-button"
            >
              Remove
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .user-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .user-address {
          font-family: monospace;
          font-size: 14px;
        }

        .permission-badges {
          display: flex;
          gap: 8px;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .badge.read {
          background: #e3f2fd;
          color: #1976d2;
        }

        .badge.write {
          background: #fff3e0;
          color: #f57c00;
        }

        .badge.admin {
          background: #fce4ec;
          color: #c2185b;
        }

        .permission-edit {
          display: flex;
          gap: 16px;
        }

        .permission-edit label {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .user-actions {
          display: flex;
          gap: 8px;
        }

        .user-actions button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }

        .user-actions button:hover {
          background: #f5f5f5;
        }

        .user-actions button:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .remove-button {
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
}

export default PermissionManager;