import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Role } from '../rbac/entities/role.entity.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AuditLogModule],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
