import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

export enum AuditAction {
  // Organization actions
  ORGANIZATION_CREATED = 'organization.created',
  ORGANIZATION_UPDATED = 'organization.updated',
  ORGANIZATION_DELETED = 'organization.deleted',

  // Membership actions
  MEMBER_ADDED = 'member.added',
  MEMBER_REMOVED = 'member.removed',
  MEMBER_ROLE_CHANGED = 'member.role_changed',

  // User actions
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Auth actions
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  PASSWORD_CHANGED = 'password.changed',
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ length: 100 })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @Column({ length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ length: 500, nullable: true })
  userAgent: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Prevent updates to audit log entries (append-only).
   * This is enforced at both the service level and database level.
   */
  @BeforeInsert()
  freezeExistingEntry() {
    // Audit logs are append-only — no updates allowed
  }
}
