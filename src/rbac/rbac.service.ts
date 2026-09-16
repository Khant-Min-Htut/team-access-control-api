import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RbacRepository } from './rbac.repository.js';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto.js';
import { RoleResponseDto } from './dto/role-response.dto.js';
import { PermissionResponseDto } from './dto/permission-response.dto.js';
import { DEFAULT_ROLES, PERMISSIONS, PermissionName } from './rbac.constants.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(private readonly rbacRepository: RbacRepository) {}

  async onModuleInit() {
    await this.seedDefaultData();
  }

  private async seedDefaultData(): Promise<void> {
    // Seed permissions
    const existingPermissions = await this.rbacRepository.findAllPermissions();
    if (existingPermissions.length === 0) {
      const permissionData = Object.values(PERMISSIONS).map((p) => ({
        name: p.name,
        resource: p.resource,
        action: p.action,
      }));
      await this.rbacRepository.createPermissions(permissionData);
      console.log('Default permissions seeded');
    }

    // Seed roles
    const existingRoles = await this.rbacRepository.findAllRoles();
    if (existingRoles.length === 0) {
      for (const roleData of Object.values(DEFAULT_ROLES)) {
        const role = await this.rbacRepository.createRole({
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem,
        });
        await this.rbacRepository.assignPermissionsToRole(
          role.id,
          [...roleData.permissions],
        );
      }
      console.log('Default roles seeded');
    }
  }

  // Role CRUD
  async findAllRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.rbacRepository.findAllRoles();
    return plainToInstance(RoleResponseDto, roles);
  }

  async findRoleById(id: string): Promise<RoleResponseDto> {
    const role = await this.rbacRepository.findRoleById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return plainToInstance(RoleResponseDto, role);
  }

  async findRoleByName(name: string): Promise<RoleResponseDto> {
    const role = await this.rbacRepository.findRoleByName(name);
    if (!role) {
      throw new NotFoundException(`Role with name '${name}' not found`);
    }
    return plainToInstance(RoleResponseDto, role);
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    // Check if role name already exists
    const exists = await this.rbacRepository.existsRoleByName(
      createRoleDto.name,
    );
    if (exists) {
      throw new ConflictException(
        `Role with name '${createRoleDto.name}' already exists`,
      );
    }

    const role = await this.rbacRepository.createRole({
      name: createRoleDto.name,
      description: createRoleDto.description,
      isSystem: false,
    });

    // Assign permissions if provided
    if (createRoleDto.permissionNames?.length) {
      await this.rbacRepository.assignPermissionsToRole(
        role.id,
        createRoleDto.permissionNames,
      );
    }

    const updatedRole = await this.rbacRepository.findRoleById(role.id);
    return plainToInstance(RoleResponseDto, updatedRole);
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.rbacRepository.findRoleById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Prevent updating system roles
    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system roles');
    }

    await this.rbacRepository.updateRole(id, {
      description: updateRoleDto.description,
    });

    // Update permissions if provided
    if (updateRoleDto.permissionNames) {
      await this.rbacRepository.assignPermissionsToRole(
        id,
        updateRoleDto.permissionNames,
      );
    }

    const updatedRole = await this.rbacRepository.findRoleById(id);
    return plainToInstance(RoleResponseDto, updatedRole);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.rbacRepository.findRoleById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system roles');
    }

    await this.rbacRepository.deleteRole(id);
  }

  // Permission methods
  async findAllPermissions(): Promise<PermissionResponseDto[]> {
    const permissions = await this.rbacRepository.findAllPermissions();
    return plainToInstance(PermissionResponseDto, permissions);
  }

  // Permission checking
  async userHasPermission(
    user: User,
    permissionName: PermissionName,
  ): Promise<boolean> {
    // Get user's RBAC role from relationship
    const role = user.rbacRole;
    if (!role) {
      // Fallback: try to find role by user.role string for backward compatibility
      const fallbackRole = await this.rbacRepository.findRoleByName(user.role);
      if (!fallbackRole) {
        return false;
      }
      return fallbackRole.permissions.some((p) => p.name === permissionName);
    }

    // Check if role has the permission
    return role.permissions.some((p) => p.name === permissionName);
  }

  async userHasAnyPermission(
    user: User,
    permissionNames: PermissionName[],
  ): Promise<boolean> {
    const role = user.rbacRole;
    if (!role) {
      // Fallback: try to find role by user.role string for backward compatibility
      const fallbackRole = await this.rbacRepository.findRoleByName(user.role);
      if (!fallbackRole) {
        return false;
      }
      return permissionNames.some((name) =>
        fallbackRole.permissions.some((p) => p.name === name),
      );
    }

    return permissionNames.some((name) =>
      role.permissions.some((p) => p.name === name),
    );
  }

  async userHasAllPermissions(
    user: User,
    permissionNames: PermissionName[],
  ): Promise<boolean> {
    const role = user.rbacRole;
    if (!role) {
      // Fallback: try to find role by user.role string for backward compatibility
      const fallbackRole = await this.rbacRepository.findRoleByName(user.role);
      if (!fallbackRole) {
        return false;
      }
      return permissionNames.every((name) =>
        fallbackRole.permissions.some((p) => p.name === name),
      );
    }

    return permissionNames.every((name) =>
      role.permissions.some((p) => p.name === name),
    );
  }

  async getUserPermissions(user: User): Promise<string[]> {
    const role = user.rbacRole;
    if (!role) {
      // Fallback: try to find role by user.role string for backward compatibility
      const fallbackRole = await this.rbacRepository.findRoleByName(user.role);
      if (!fallbackRole) {
        return [];
      }
      return fallbackRole.permissions.map((p) => p.name);
    }
    return role.permissions.map((p) => p.name);
  }
}
