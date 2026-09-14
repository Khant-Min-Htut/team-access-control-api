import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity.js';
import { Membership } from './entities/membership.entity.js';
import { OrganizationsRepository } from './organizations.repository.js';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationsController } from './organizations.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Membership]), AuditLogModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsRepository, OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
