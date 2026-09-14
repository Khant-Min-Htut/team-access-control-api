import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service.js';
import {
  REQUIRE_PERMISSION_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
} from '../decorators/index.js';
import { User } from '../../users/entities/user.entity.js';
import { PermissionName } from '../rbac.constants.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorators
    const requireAnyPermissions = this.reflector.getAllAndOverride<
      PermissionName[]
    >(REQUIRE_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    const requireAllPermissions = this.reflector.getAllAndOverride<
      PermissionName[]
    >(REQUIRE_ALL_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // If no permissions required, allow access
    if (!requireAnyPermissions && !requireAllPermissions) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check permissions
    if (requireAnyPermissions) {
      const hasAny = await this.rbacService.userHasAnyPermission(
        user,
        requireAnyPermissions,
      );
      if (!hasAny) {
        throw new ForbiddenException(
          `User does not have required permissions: ${requireAnyPermissions.join(', ')}`,
        );
      }
    }

    if (requireAllPermissions) {
      const hasAll = await this.rbacService.userHasAllPermissions(
        user,
        requireAllPermissions,
      );
      if (!hasAll) {
        throw new ForbiddenException(
          `User does not have all required permissions: ${requireAllPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
