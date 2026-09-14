import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import type { Role } from './role.entity.js';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string; // e.g., 'users:create', 'organizations:delete'

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ length: 50 })
  resource: string; // e.g., 'users', 'organizations'

  @Column({ length: 50 })
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @ManyToMany('Role', (role: Role) => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
