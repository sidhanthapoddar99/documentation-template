// Permission Matrix Definition
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'server' | 'role' | 'verification' | 'analytics' | 'emergency';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RolePermissions {
  role: 'owner' | 'admin' | 'manager';
  permissions: Permission[];
}

// Complete Permission List
export const PERMISSIONS: Record<string, Permission> = {
  // System Permissions
  SYSTEM_PAUSE: {
    id: 'system.pause',
    name: 'Pause System',
    description: 'Emergency pause all system operations',
    category: 'emergency',
    riskLevel: 'critical'
  },
  SYSTEM_UPGRADE: {
    id: 'system.upgrade',
    name: 'Upgrade Contracts',
    description: 'Deploy and activate contract upgrades',
    category: 'system',
    riskLevel: 'critical'
  },
  SYSTEM_CONFIG: {
    id: 'system.config',
    name: 'System Configuration',
    description: 'Modify global system parameters',
    category: 'system',
    riskLevel: 'high'
  },
  
  // Server Permissions
  SERVER_REGISTER: {
    id: 'server.register',
    name: 'Register Servers',
    description: 'Mint new server NFTs',
    category: 'server',
    riskLevel: 'medium'
  },
  SERVER_UPDATE: {
    id: 'server.update',
    name: 'Update Server Metadata',
    description: 'Modify server configuration',
    category: 'server',
    riskLevel: 'medium'
  },
  SERVER_VERIFY: {
    id: 'server.verify',
    name: 'Verify Servers',
    description: 'Approve server verification requests',
    category: 'verification',
    riskLevel: 'medium'
  },
  SERVER_DELETE: {
    id: 'server.delete',
    name: 'Delete Servers',
    description: 'Burn server NFTs',
    category: 'server',
    riskLevel: 'high'
  },
  SERVER_VIEW: {
    id: 'server.view',
    name: 'View Servers',
    description: 'Access server information',
    category: 'server',
    riskLevel: 'low'
  },
  
  // Role Permissions
  ROLE_GRANT_OWNER: {
    id: 'role.grant.owner',
    name: 'Grant Owner Role',
    description: 'Add new system owners',
    category: 'role',
    riskLevel: 'critical'
  },
  ROLE_GRANT_ADMIN: {
    id: 'role.grant.admin',
    name: 'Grant Admin Role',
    description: 'Add new administrators',
    category: 'role',
    riskLevel: 'high'
  },
  ROLE_GRANT_MANAGER: {
    id: 'role.grant.manager',
    name: 'Grant Manager Role',
    description: 'Add new managers',
    category: 'role',
    riskLevel: 'medium'
  },
  ROLE_REVOKE: {
    id: 'role.revoke',
    name: 'Revoke Roles',
    description: 'Remove user permissions',
    category: 'role',
    riskLevel: 'high'
  },
  ROLE_VIEW: {
    id: 'role.view',
    name: 'View Roles',
    description: 'Access role assignments',
    category: 'role',
    riskLevel: 'low'
  },
  
  // Analytics Permissions
  ANALYTICS_FULL: {
    id: 'analytics.full',
    name: 'Full Analytics Access',
    description: 'View all system analytics',
    category: 'analytics',
    riskLevel: 'low'
  },
  ANALYTICS_LIMITED: {
    id: 'analytics.limited',
    name: 'Limited Analytics',
    description: 'View basic system metrics',
    category: 'analytics',
    riskLevel: 'low'
  },
  
  // Emergency Permissions
  EMERGENCY_WITHDRAW: {
    id: 'emergency.withdraw',
    name: 'Emergency Withdraw',
    description: 'Withdraw funds in emergency',
    category: 'emergency',
    riskLevel: 'critical'
  },
  EMERGENCY_OVERRIDE: {
    id: 'emergency.override',
    name: 'Emergency Override',
    description: 'Override system restrictions',
    category: 'emergency',
    riskLevel: 'critical'
  }
};

// Role Permission Mapping
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'owner',
    permissions: [
      // Owners have all permissions
      ...Object.values(PERMISSIONS)
    ]
  },
  {
    role: 'admin',
    permissions: [
      PERMISSIONS.SYSTEM_CONFIG,
      PERMISSIONS.SERVER_REGISTER,
      PERMISSIONS.SERVER_UPDATE,
      PERMISSIONS.SERVER_VERIFY,
      PERMISSIONS.SERVER_DELETE,
      PERMISSIONS.SERVER_VIEW,
      PERMISSIONS.ROLE_GRANT_ADMIN,
      PERMISSIONS.ROLE_GRANT_MANAGER,
      PERMISSIONS.ROLE_REVOKE,
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.ANALYTICS_FULL
    ]
  },
  {
    role: 'manager',
    permissions: [
      PERMISSIONS.SERVER_VERIFY,
      PERMISSIONS.SERVER_VIEW,
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.ANALYTICS_LIMITED
    ]
  }
];

// Permission Checking Functions
export function hasPermission(
  userRole: 'owner' | 'admin' | 'manager' | null,
  permissionId: string
): boolean {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === userRole);
  if (!rolePermissions) return false;
  
  return rolePermissions.permissions.some(p => p.id === permissionId);
}

export function getPermissionsForRole(
  role: 'owner' | 'admin' | 'manager'
): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === role);
  return rolePermissions?.permissions || [];
}

export function canGrantRole(
  granterRole: 'owner' | 'admin' | 'manager' | null,
  targetRole: 'owner' | 'admin' | 'manager'
): boolean {
  if (!granterRole) return false;
  
  // Owners can grant any role
  if (granterRole === 'owner') return true;
  
  // Admins can grant admin and manager roles
  if (granterRole === 'admin') {
    return targetRole === 'admin' || targetRole === 'manager';
  }
  
  // Managers cannot grant roles
  return false;
}

// UI Helper Functions
export function getPermissionsByCategory(
  category: Permission['category']
): Permission[] {
  return Object.values(PERMISSIONS).filter(p => p.category === category);
}

export function getRiskLevelColor(riskLevel: Permission['riskLevel']): string {
  const colors = {
    low: '#51cf66',      // Green
    medium: '#ffd43b',   // Yellow
    high: '#ff8787',     // Orange
    critical: '#ff6b6b'  // Red
  };
  return colors[riskLevel];
}

// Permission Matrix Component Helper
export function generatePermissionMatrix(): {
  permission: Permission;
  owner: boolean;
  admin: boolean;
  manager: boolean;
}[] {
  return Object.values(PERMISSIONS).map(permission => ({
    permission,
    owner: hasPermission('owner', permission.id),
    admin: hasPermission('admin', permission.id),
    manager: hasPermission('manager', permission.id)
  }));
}