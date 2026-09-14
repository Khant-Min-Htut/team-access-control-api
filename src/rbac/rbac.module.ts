import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { RbacRepository } from './rbac.repository.js';
import { RbacService } from './rbac.service.js';
import { RbacController } from './rbac.controller.js';
import { PermissionGuard } from './guards/permission.guard.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RbacController],
  providers: [
    RbacRepository,
    RbacService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  exports: [RbacService],
})
export class RbacModule {}
