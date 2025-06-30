// Portal Component Structure
const portalStructure = {
  // Layout Components
  layout: {
    Dashboard: {
      path: 'components/layout/Dashboard.tsx',
      description: 'Main dashboard container with responsive layout'
    },
    Sidebar: {
      path: 'components/layout/Sidebar.tsx',
      description: 'Navigation sidebar with role-based menu items'
    },
    Header: {
      path: 'components/layout/Header.tsx',
      description: 'Top header with search, notifications, and profile'
    },
    Footer: {
      path: 'components/layout/Footer.tsx',
      description: 'Footer with system status and links'
    }
  },

  // Server Management Components
  servers: {
    ServerList: {
      path: 'components/servers/ServerList.tsx',
      description: 'Grid/list view of all servers with filtering',
      features: ['Real-time health status', 'Batch operations', 'Quick actions']
    },
    ServerCard: {
      path: 'components/servers/ServerCard.tsx',
      description: 'Individual server display card',
      props: {
        server: 'ServerInfo object',
        onEdit: 'Edit callback',
        onDelete: 'Delete callback'
      }
    },
    ServerDetails: {
      path: 'components/servers/ServerDetails.tsx',
      description: 'Detailed server information modal'
    },
    AddServerModal: {
      path: 'components/servers/AddServerModal.tsx',
      description: 'Multi-step server registration wizard'
    }
  },

  // Role Management Components
  roles: {
    RoleManagement: {
      path: 'components/roles/RoleManagement.tsx',
      description: 'Main role management interface'
    },
    UserTable: {
      path: 'components/roles/UserTable.tsx',
      description: 'Searchable user list with role assignments'
    },
    PermissionMatrix: {
      path: 'components/roles/PermissionMatrix.tsx',
      description: 'Visual permission comparison chart'
    }
  },

  // Verification Components
  verification: {
    VerificationQueue: {
      path: 'components/verification/VerificationQueue.tsx',
      description: 'List of pending server verifications'
    },
    ApprovalPanel: {
      path: 'components/verification/ApprovalPanel.tsx',
      description: 'Detailed verification interface with checks'
    }
  },

  // Analytics Components
  analytics: {
    AnalyticsDashboard: {
      path: 'components/analytics/AnalyticsDashboard.tsx',
      description: 'Main analytics view with charts'
    },
    ServerMetrics: {
      path: 'components/analytics/ServerMetrics.tsx',
      description: 'Individual server performance metrics'
    },
    NetworkHealth: {
      path: 'components/analytics/NetworkHealth.tsx',
      description: 'Overall network status visualization'
    }
  },

  // Shared UI Components (shadcn/ui)
  ui: {
    Button: 'Standard buttons with variants',
    Card: 'Content containers',
    Dialog: 'Modal dialogs',
    Table: 'Data tables with sorting/filtering',
    Toast: 'Notification toasts',
    Select: 'Dropdown selections',
    Input: 'Form inputs with validation',
    Tabs: 'Tabbed interfaces',
    Badge: 'Status badges',
    Alert: 'Alert messages'
  }
};

// State Management Structure
const stateStructure = {
  auth: {
    user: 'Current user address',
    role: 'User role (owner/admin/manager)',
    permissions: 'Array of permission strings',
    session: 'JWT token and expiry'
  },
  servers: {
    list: 'Array of server objects',
    loading: 'Loading state',
    filters: 'Active filters',
    selected: 'Selected server for details'
  },
  roles: {
    users: 'User list with roles',
    pending: 'Pending role changes',
    history: 'Role change history'
  },
  settings: {
    theme: 'light/dark mode',
    notifications: 'Notification preferences',
    display: 'Display preferences'
  }
};

export { portalStructure, stateStructure };