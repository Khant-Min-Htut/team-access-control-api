import { SetMetadata } from '@nestjs/common';
import { PermissionName } from '../rbac.constants.js';

export const REQUIRE_ALL_PERMISSIONS_KEY = 'require_all_permissions';
export const RequireAllPermissions = (...permissions: PermissionName[]) =>
  SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, permissions);
