import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';

@Injectable()
export class RbacRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // Role methods
  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findRoleById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    await this.roleRepository.update(id, data);
    return this.findRoleById(id);
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }

  async existsRoleByName(name: string, excludeId?: string): Promise<boolean> {
    const query = this.roleRepository
      .createQueryBuilder('role')
      .where('role.name = :name', { name });

    if (excludeId) {
      query.andWhere('role.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  // Permission methods
  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findPermissionById(id: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  async findPermissionByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { name } });
  }

  async findPermissionsByNames(names: string[]): Promise<Permission[]> {
    return this.permissionRepository.find({ where: { name: In(names) } });
  }

  async createPermission(data: Partial<Permission>): Promise<Permission> {
    const permission = this.permissionRepository.create(data);
    return this.permissionRepository.save(permission);
  }

  async createPermissions(
    data: Partial<Permission>[],
  ): Promise<Permission[]> {
    const permissions = this.permissionRepository.create(data);
    return this.permissionRepository.save(permissions);
  }

  // Role-Permission methods
  async assignPermissionsToRole(
    roleId: string,
    permissionNames: string[],
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    const permissions = await this.findPermissionsByNames(permissionNames);
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.findRoleById(roleId);
    return role?.permissions || [];
  }
}
