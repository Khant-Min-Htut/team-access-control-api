import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuditAction } from '../entities/audit-log.entity.js';

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Audit log entry ID (UUID)' })
  @Expose()
  id: string;

  @ApiProperty({ enum: AuditAction, description: 'Audit action performed' })
  @Expose()
  action: AuditAction;

  @ApiProperty({ description: 'Entity type (e.g. Organization, User, Membership)' })
  @Expose()
  entityType: string;

  @ApiPropertyOptional({ description: 'Entity ID (UUID)' })
  @Expose()
  entityId: string | null;

  @ApiPropertyOptional({ description: 'User who performed the action (UUID)' })
  @Expose()
  userId: string | null;

  @ApiProperty({ description: 'Additional metadata about the action' })
  @Expose()
  metadata: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'IP address of the request' })
  @Expose()
  ipAddress: string | null;

  @ApiPropertyOptional({ description: 'User agent of the request' })
  @Expose()
  userAgent: string | null;

  @ApiProperty({ description: 'Timestamp of the audit log entry' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  constructor(partial: Partial<AuditLogResponseDto>) {
    Object.assign(this, partial);
  }
}
