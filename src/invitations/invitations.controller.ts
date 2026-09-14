import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import {
  InvitationResponseDto,
  InvitationWithTokenDto,
} from './dto/invitation-response.dto.js';
import { ValidatedInvitationDto } from './dto/validated-invitation.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '../rbac/rbac.constants.js';
import { User } from '../users/entities/user.entity.js';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('organizations/:organizationId')
  @RequirePermission(PERMISSIONS.MEMBERSHIPS_CREATE.name)
  async create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @CurrentUser() user: User,
  ): Promise<InvitationWithTokenDto> {
    return this.invitationsService.create(
      organizationId,
      createInvitationDto,
      user,
    );
  }

  @Public()
  @Get('validate/:token')
  async validate(
    @Param('token') token: string,
  ): Promise<ValidatedInvitationDto> {
    return this.invitationsService.validate(token);
  }

  @Public()
  @Post('accept')
  async accept(
    @Body() acceptInvitationDto: AcceptInvitationDto,
    @CurrentUser() user: User,
  ): Promise<{ organizationId: string; role: string }> {
    const result = await this.invitationsService.accept(
      acceptInvitationDto.token,
      user,
    );
    return {
      organizationId: result.organizationId,
      role: result.role,
    };
  }

  @Post(':invitationId/revoke')
  @RequirePermission(PERMISSIONS.MEMBERSHIPS_DELETE.name)
  async revoke(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.invitationsService.revoke(invitationId, user);
    return { message: 'Invitation revoked successfully' };
  }

  @Get('organizations/:organizationId')
  @RequirePermission(PERMISSIONS.MEMBERSHIPS_READ.name)
  async findByOrganization(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: User,
  ): Promise<InvitationResponseDto[]> {
    return this.invitationsService.findByOrganization(organizationId, user);
  }
}
