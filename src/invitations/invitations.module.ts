import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity.js';
import { InvitationsRepository } from './invitations.repository.js';
import { InvitationsService } from './invitations.service.js';
import { InvitationsController } from './invitations.controller.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation]),
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsRepository, InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
