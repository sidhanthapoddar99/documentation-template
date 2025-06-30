import React, { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Search, UserPlus, Shield, History, Download } from 'lucide-react';
import { hasPermission, canGrantRole } from './permission-matrix';

interface User {
  address: string;
  ensName?: string;
  role: 'owner' | 'admin' | 'manager' | null;
  assignedAt: number;
  assignedBy: string;
  lastActive?: number;
}

interface RoleChange {
  user: string;
  previousRole: string | null;
  newRole: string | null;
  changedBy: string;
  timestamp: number;
  transactionHash: string;
  reason?: string;
}

export function RoleManagement() {
  const { registry } = useContract();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [roleHistory, setRoleHistory] = useState<RoleChange[]>([]);
  
  // Current user info (from auth context)
  const currentUserRole = 'admin'; // This would come from auth context
  
  // Fetch users and their roles
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Apply filters
  useEffect(() => {
    let filtered = users;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.ensName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        roleFilter === 'none' ? !user.role : user.role === roleFilter
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch role events from contract
      const filter = registry.filters.RoleGranted();
      const events = await registry.queryFilter(filter);
      
      // Build user list from events
      const userMap = new Map<string, User>();
      
      for (const event of events) {
        const { account, role, sender } = event.args;
        const timestamp = (await event.getBlock()).timestamp;
        
        userMap.set(account, {
          address: account,
          role: decodeRole(role),
          assignedAt: timestamp,
          assignedBy: sender
        });
      }
      
      // Check for revoked roles
      const revokeFilter = registry.filters.RoleRevoked();
      const revokeEvents = await registry.queryFilter(revokeFilter);
      
      for (const event of revokeEvents) {
        const { account } = event.args;
        const user = userMap.get(account);
        if (user) {
          user.role = null;
        }
      }
      
      // Resolve ENS names
      await resolveENSNames(Array.from(userMap.values()));
      
      setUsers(Array.from(userMap.values()));
    } catch (error) {
      toast({
        title: "Failed to fetch users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resolveENSNames = async (users: User[]) => {
    // ENS resolution logic would go here
    // This is a placeholder
    return users;
  };
  
  const decodeRole = (roleBytes: string): 'owner' | 'admin' | 'manager' | null => {
    // Decode role from bytes32
    const roleMap = {
      '0x...': 'owner',
      '0x...': 'admin',
      '0x...': 'manager'
    };
    return roleMap[roleBytes] || null;
  };
  
  const handleRoleChange = async (user: User, newRole: string, reason?: string) => {
    try {
      // Validate permissions
      if (!canGrantRole(currentUserRole, newRole as any)) {
        throw new Error('Insufficient permissions');
      }
      
      // Prepare transaction
      let tx;
      if (newRole === 'none') {
        tx = await registry.revokeRole(user.address, encodeRole(user.role!));
      } else {
        tx = await registry.grantRole(user.address, encodeRole(newRole));
      }
      
      toast({
        title: "Transaction submitted",
        description: `Updating role for ${user.ensName || user.address}`
      });
      
      // Wait for confirmation
      await tx.wait();
      
      // Log to audit trail
      await logRoleChange({
        user: user.address,
        previousRole: user.role,
        newRole: newRole === 'none' ? null : newRole,
        reason,
        transactionHash: tx.hash
      });
      
      toast({
        title: "Role updated successfully",
        description: `${user.ensName || user.address} is now ${newRole === 'none' ? 'removed' : newRole}`
      });
      
      // Refresh user list
      await fetchUsers();
      
    } catch (error) {
      toast({
        title: "Role update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const encodeRole = (role: string): string => {
    // Encode role to bytes32
    const roleMap = {
      'owner': '0x...',
      'admin': '0x...',
      'manager': '0x...'
    };
    return roleMap[role];
  };
  
  const logRoleChange = async (change: Partial<RoleChange>) => {
    // Send to audit service
    const response = await fetch('/api/audit/role-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...change,
        changedBy: currentUserRole,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      console.error('Failed to log role change');
    }
  };
  
  const exportUsers = () => {
    const data = filteredUsers.map(user => ({
      address: user.address,
      ensName: user.ensName || '',
      role: user.role || 'none',
      assignedAt: new Date(user.assignedAt * 1000).toISOString(),
      assignedBy: user.assignedBy
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${Date.now()}.csv`;
    a.click();
  };
  
  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'owner': return 'destructive';
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportUsers}
            disabled={filteredUsers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowAssignDialog(true)}
            disabled={!hasPermission(currentUserRole, 'role.grant.manager')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address or ENS name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="manager">Managers</SelectItem>
            <SelectItem value="none">No Role</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* User Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.address}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.ensName || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                      </div>
                      {user.ensName && (
                        <div className="text-sm text-muted-foreground">
                          {`${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role || 'No Role'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.assignedAt * 1000).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.lastActive 
                      ? new Date(user.lastActive * 1000).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          // Fetch history
                          setShowHistoryDialog(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignDialog(true);
                        }}
                        disabled={!hasPermission(currentUserRole, 'role.grant.manager')}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Role Assignment Dialog */}
      {showAssignDialog && (
        <RoleAssignmentDialog
          user={selectedUser}
          currentUserRole={currentUserRole}
          onAssign={handleRoleChange}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedUser(null);
          }}
        />
      )}
      
      {/* History Dialog */}
      {showHistoryDialog && selectedUser && (
        <RoleHistoryDialog
          user={selectedUser}
          history={roleHistory}
          onClose={() => {
            setShowHistoryDialog(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// Role Assignment Dialog Component
function RoleAssignmentDialog({ user, currentUserRole, onAssign, onClose }) {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'manager');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onAssign(user || { address: '' }, selectedRole, reason);
    setIsSubmitting(false);
    onClose();
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user ? 'Change User Role' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? `Update role for ${user.ensName || user.address}`
              : 'Grant role to a new user'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!user && (
            <div>
              <label className="text-sm font-medium">User Address</label>
              <Input placeholder="0x..." />
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canGrantRole(currentUserRole, 'manager') && (
                  <SelectItem value="manager">Manager</SelectItem>
                )}
                {canGrantRole(currentUserRole, 'admin') && (
                  <SelectItem value="admin">Admin</SelectItem>
                )}
                {canGrantRole(currentUserRole, 'owner') && (
                  <SelectItem value="owner">Owner</SelectItem>
                )}
                {user && <SelectItem value="none">Remove Role</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Reason (Optional)</label>
            <Input
              placeholder="Reason for role change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Role History Dialog Component
function RoleHistoryDialog({ user, history, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Role History</DialogTitle>
          <DialogDescription>
            Role changes for {user.ensName || user.address}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground">No role changes recorded</p>
          ) : (
            history.map((change, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {change.previousRole || 'No Role'} → {change.newRole || 'No Role'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      By {change.changedBy} • {new Date(change.timestamp).toLocaleString()}
                    </p>
                    {change.reason && (
                      <p className="text-sm mt-1">Reason: {change.reason}</p>
                    )}
                  </div>
                  <a
                    href={`https://etherscan.io/tx/${change.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View TX
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}