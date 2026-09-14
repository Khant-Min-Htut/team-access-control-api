import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { RbacService } from './rbac.service.js';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto.js';
import { RoleResponseDto } from './dto/role-response.dto.js';
import { PermissionResponseDto } from './dto/permission-response.dto.js';
import { RequirePermission } from './decorators/require-permission.decorator.js';
import { PERMISSIONS } from './rbac.constants.js';

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // Roles
  @Get('roles')
  @RequirePermission(PERMISSIONS.ROLES_READ.name)
  async findAllRoles(): Promise<RoleResponseDto[]> {
    return this.rbacService.findAllRoles();
  }

  @Get('roles/:id')
  @RequirePermission(PERMISSIONS.ROLES_READ.name)
  async findRoleById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoleResponseDto> {
    return this.rbacService.findRoleById(id);
  }

  @Post('roles')
  @RequirePermission(PERMISSIONS.ROLES_CREATE.name)
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rbacService.createRole(createRoleDto);
  }

  @Put('roles/:id')
  @RequirePermission(PERMISSIONS.ROLES_UPDATE.name)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rbacService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @RequirePermission(PERMISSIONS.ROLES_DELETE.name)
  async deleteRole(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.rbacService.deleteRole(id);
  }

  // Permissions
  @Get('permissions')
  @RequirePermission(PERMISSIONS.ROLES_READ.name)
  async findAllPermissions(): Promise<PermissionResponseDto[]> {
    return this.rbacService.findAllPermissions();
  }
}
