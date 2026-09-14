// Default Permissions
export const PERMISSIONS = {
  // Users
  USERS_CREATE: { name: 'users:create', resource: 'users', action: 'create' },
  USERS_READ: { name: 'users:read', resource: 'users', action: 'read' },
  USERS_UPDATE: { name: 'users:update', resource: 'users', action: 'update' },
  USERS_DELETE: { name: 'users:delete', resource: 'users', action: 'delete' },

  // Organizations
  ORGANIZATIONS_CREATE: {
    name: 'organizations:create',
    resource: 'organizations',
    action: 'create',
  },
  ORGANIZATIONS_READ: {
    name: 'organizations:read',
    resource: 'organizations',
    action: 'read',
  },
  ORGANIZATIONS_UPDATE: {
    name: 'organizations:update',
    resource: 'organizations',
    action: 'update',
  },
  ORGANIZATIONS_DELETE: {
    name: 'organizations:delete',
    resource: 'organizations',
    action: 'delete',
  },

  // Memberships
  MEMBERSHIPS_CREATE: {
    name: 'memberships:create',
    resource: 'memberships',
    action: 'create',
  },
  MEMBERSHIPS_READ: {
    name: 'memberships:read',
    resource: 'memberships',
    action: 'read',
  },
  MEMBERSHIPS_DELETE: {
    name: 'memberships:delete',
    resource: 'memberships',
    action: 'delete',
  },

  // Roles
  ROLES_CREATE: { name: 'roles:create', resource: 'roles', action: 'create' },
  ROLES_READ: { name: 'roles:read', resource: 'roles', action: 'read' },
  ROLES_UPDATE: { name: 'roles:update', resource: 'roles', action: 'update' },
  ROLES_DELETE: { name: 'roles:delete', resource: 'roles', action: 'delete' },
} as const;

// Default Roles with their permissions
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'super_admin',
    description: 'Super administrator with full access',
    isSystem: true,
    permissions: Object.values(PERMISSIONS).map((p) => p.name),
  },
  ADMIN: {
    name: 'admin',
    description: 'Organization administrator',
    isSystem: true,
    permissions: [
      PERMISSIONS.USERS_READ.name,
      PERMISSIONS.USERS_UPDATE.name,
      PERMISSIONS.ORGANIZATIONS_CREATE.name,
      PERMISSIONS.ORGANIZATIONS_READ.name,
      PERMISSIONS.ORGANIZATIONS_UPDATE.name,
      PERMISSIONS.ORGANIZATIONS_DELETE.name,
      PERMISSIONS.MEMBERSHIPS_CREATE.name,
      PERMISSIONS.MEMBERSHIPS_READ.name,
      PERMISSIONS.MEMBERSHIPS_DELETE.name,
    ],
  },
  MEMBER: {
    name: 'member',
    description: 'Regular member',
    isSystem: true,
    permissions: [
      PERMISSIONS.USERS_READ.name,
      PERMISSIONS.ORGANIZATIONS_READ.name,
      PERMISSIONS.MEMBERSHIPS_READ.name,
    ],
  },
  VIEWER: {
    name: 'viewer',
    description: 'Read-only access',
    isSystem: true,
    permissions: [
      PERMISSIONS.USERS_READ.name,
      PERMISSIONS.ORGANIZATIONS_READ.name,
    ],
  },
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]['name'];
export type RoleName = (typeof DEFAULT_ROLES)[keyof typeof DEFAULT_ROLES]['name'];
