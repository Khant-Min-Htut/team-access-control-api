import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { Role } from '../rbac/entities/role.entity.js';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.repository.update(id, { refreshToken });
  }

  async create(data: Partial<User>): Promise<User> {
    // Find corresponding RBAC role based on user role
    const rbacRole = await this.roleRepository.findOne({
      where: { name: data.role || 'member' },
    });

    const user = this.repository.create({
      ...data,
      rbacRoleId: rbacRole?.id || null,
    });
    return this.repository.save(user);
  }

  async update(
    id: string,
    data: Partial<User> & { rbacRoleId?: string },
  ): Promise<User | null> {
    if (data.role) {
      const rbacRole = await this.roleRepository.findOne({
        where: { name: data.role },
      });
      const { role, ...otherData } = data;
      await this.repository.update(id, {
        ...otherData,
        rbacRoleId: rbacRole?.id || null,
      });
    } else if (data.rbacRoleId !== undefined) {
      const { rbacRoleId, ...otherData } = data;
      await this.repository.update(id, {
        ...otherData,
        rbacRoleId,
      });
    } else {
      await this.repository.update(id, data);
    }
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (excludeId) {
      query.andWhere('user.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }
}
