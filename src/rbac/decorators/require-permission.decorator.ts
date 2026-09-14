import { SetMetadata } from '@nestjs/common';
import { PermissionName } from '../rbac.constants.js';

export const REQUIRE_PERMISSION_KEY = 'require_permission';
export const RequirePermission = (...permissions: PermissionName[]) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permissions);
