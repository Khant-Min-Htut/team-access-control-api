import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service.js';
import { QueryAuditLogDto } from './dto/query-audit-log.dto.js';
import { AuditLogResponseDto } from './dto/audit-log-response.dto.js';

@ApiTags('Audit Logs')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries' })
  async findAll(
    @Query() queryDto: QueryAuditLogDto,
  ): Promise<{ data: AuditLogResponseDto[]; total: number; page: number; limit: number }> {
    return this.auditLogService.findAll(queryDto);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiParam({ name: 'entityType', description: 'Entity type (e.g. Organization, User)' })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Audit log entries for the entity', type: [AuditLogResponseDto] })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ): Promise<AuditLogResponseDto[]> {
    return this.auditLogService.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Audit log entries for the user', type: [AuditLogResponseDto] })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AuditLogResponseDto[]> {
    return this.auditLogService.findByUser(userId);
  }
}
