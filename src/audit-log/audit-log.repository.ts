import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity.js';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  /**
   * Append a new audit log entry.
   * Audit logs are append-only — this method only creates, never updates.
   */
  async append(data: Partial<AuditLog>): Promise<AuditLog> {
    const entry = this.repository.create(data);
    return this.repository.save(entry);
  }

  /**
   * Query audit logs with filtering and pagination.
   * Returns entries in descending order (newest first).
   */
  async findMany(filters: {
    action?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const query = this.repository.createQueryBuilder('audit');

    if (filters.action) {
      query.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.entityType) {
      query.andWhere('audit.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters.entityId) {
      query.andWhere('audit.entityId = :entityId', {
        entityId: filters.entityId,
      });
    }

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    } else if (filters.startDate) {
      query.andWhere('audit.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    } else if (filters.endDate) {
      query.andWhere('audit.createdAt <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const total = await query.getCount();

    const data = await query
      .orderBy('audit.createdAt', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getMany();

    return { data, total };
  }

  /**
   * Find audit log entries for a specific entity.
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.repository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find audit log entries for a specific user.
   */
  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
