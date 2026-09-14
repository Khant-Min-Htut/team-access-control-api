import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository.js';
import { AuditAction } from './entities/audit-log.entity.js';
import { QueryAuditLogDto } from './dto/query-audit-log.dto.js';
import { AuditLogResponseDto } from './dto/audit-log-response.dto.js';
import { plainToInstance } from 'class-transformer';

export interface CreateAuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Create a new audit log entry.
   * Audit logs are append-only — no updates or deletes are permitted.
   */
  async log(entry: CreateAuditLogEntry): Promise<void> {
    await this.auditLogRepository.append({
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      userId: entry.userId ?? null,
      metadata: entry.metadata ?? {},
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    });
  }

  /**
   * Query audit logs with filtering and pagination.
   */
  async findAll(
    queryDto: QueryAuditLogDto,
  ): Promise<{ data: AuditLogResponseDto[]; total: number; page: number; limit: number }> {
    const { data, total } = await this.auditLogRepository.findMany({
      action: queryDto.action,
      entityType: queryDto.entityType,
      entityId: queryDto.entityId,
      userId: queryDto.userId,
      startDate: queryDto.startDate,
      endDate: queryDto.endDate,
      page: queryDto.page ?? 1,
      limit: queryDto.limit ?? 50,
    });

    return {
      data: plainToInstance(AuditLogResponseDto, data),
      total,
      page: queryDto.page ?? 1,
      limit: queryDto.limit ?? 50,
    };
  }

  /**
   * Find audit logs for a specific entity.
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogResponseDto[]> {
    const entries = await this.auditLogRepository.findByEntity(
      entityType,
      entityId,
    );
    return plainToInstance(AuditLogResponseDto, entries);
  }

  /**
   * Find audit logs for a specific user.
   */
  async findByUser(userId: string): Promise<AuditLogResponseDto[]> {
    const entries = await this.auditLogRepository.findByUser(userId);
    return plainToInstance(AuditLogResponseDto, entries);
  }

  /**
   * Ensure append-only semantics — this method is intentionally excluded.
   * Audit logs cannot be updated or deleted.
   */
  private throwUpdateForbidden(): never {
    throw new ForbiddenException('Audit logs are append-only and cannot be modified');
  }
}
