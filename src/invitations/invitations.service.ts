import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { randomBytes } from 'crypto';
import { InvitationsRepository } from './invitations.repository.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import {
  InvitationResponseDto,
  InvitationWithTokenDto,
} from './dto/invitation-response.dto.js';
import { ValidatedInvitationDto } from './dto/validated-invitation.dto.js';
import { InvitationStatus } from './entities/invitation.entity.js';
import { MembershipRole } from '../organizations/entities/membership.entity.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(
    organizationId: string,
    createInvitationDto: CreateInvitationDto,
    invitedByUser: User,
  ): Promise<InvitationWithTokenDto> {
    // Verify organization exists
    const organization =
      await this.organizationsRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Verify requester is admin of the organization
    const membership = await this.organizationsRepository.findMembership(
      invitedByUser.id,
      organizationId,
    );
    if (!membership || membership.role !== MembershipRole.ADMIN) {
      throw new UnauthorizedException(
        'You must be an organization admin to send invitations',
      );
    }

    // Check if user is already a member
    const existingUser = await this.usersRepository.findByEmail(
      createInvitationDto.email,
    );
    if (existingUser) {
      const existingMembership =
        await this.organizationsRepository.findMembership(
          existingUser.id,
          organizationId,
        );
      if (existingMembership) {
        throw new ConflictException(
          'User is already a member of this organization',
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation =
      await this.invitationsRepository.findPendingByEmailAndOrganization(
        createInvitationDto.email,
        organizationId,
      );
    if (existingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    // Generate secure random token
    const token = this.generateSecureToken();

    // Calculate expiration (default: 7 days)
    const expiresInHours = createInvitationDto.expiresInHours || 168;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create invitation
    const invitation = await this.invitationsRepository.create({
      email: createInvitationDto.email,
      token,
      role: createInvitationDto.role || MembershipRole.MEMBER,
      organizationId,
      invitedByUserId: invitedByUser.id,
      expiresAt,
    });

    return plainToInstance(InvitationWithTokenDto, invitation);
  }

  async validate(token: string): Promise<ValidatedInvitationDto> {
    // Expire old invitations first
    await this.invitationsRepository.expireOldInvitations();

    const invitation =
      await this.invitationsRepository.findByTokenWithRelations(token);
    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    // Check if invitation is expired
    if (invitation.status === InvitationStatus.EXPIRED) {
      throw new BadRequestException('This invitation has expired');
    }

    // Check if invitation is already accepted
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    // Check if invitation is revoked
    if (invitation.status === InvitationStatus.REVOKED) {
      throw new BadRequestException('This invitation has been revoked');
    }

    // Check if token has expired by date
    if (new Date() > invitation.expiresAt) {
      await this.invitationsRepository.updateStatus(
        invitation.id,
        InvitationStatus.EXPIRED,
      );
      throw new BadRequestException('This invitation has expired');
    }

    return plainToInstance(ValidatedInvitationDto, {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
      organizationSlug: invitation.organization.slug,
      invitedByName: 'User', // We could fetch the inviter's name
      expiresAt: invitation.expiresAt,
    });
  }

  async accept(
    token: string,
    acceptingUser: User,
  ): Promise<{ organizationId: string; role: MembershipRole }> {
    // Validate invitation first
    const validatedInvitation = await this.validate(token);

    // Verify the accepting user's email matches the invitation
    if (acceptingUser.email !== validatedInvitation.email) {
      throw new UnauthorizedException(
        'This invitation was sent to a different email address',
      );
    }

    // Find the invitation again to get full details
    const invitation =
      await this.invitationsRepository.findByTokenWithRelations(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check for duplicate membership
    const existingMembership =
      await this.organizationsRepository.findMembership(
        acceptingUser.id,
        invitation.organizationId,
      );
    if (existingMembership) {
      throw new ConflictException(
        'You are already a member of this organization',
      );
    }

    // Create membership
    await this.organizationsRepository.createMembership(
      acceptingUser.id,
      invitation.organizationId,
      invitation.role,
    );

    // Update invitation status
    await this.invitationsRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      acceptedByUserId: acceptingUser.id,
      acceptedAt: new Date(),
    });

    return {
      organizationId: invitation.organizationId,
      role: invitation.role,
    };
  }

  async revoke(invitationId: string, revokedByUser: User): Promise<void> {
    const invitation = await this.invitationsRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${invitationId} not found`);
    }

    // Verify requester is admin of the organization
    const membership = await this.organizationsRepository.findMembership(
      revokedByUser.id,
      invitation.organizationId,
    );
    if (!membership || membership.role !== MembershipRole.ADMIN) {
      throw new UnauthorizedException(
        'You must be an organization admin to revoke invitations',
      );
    }

    // Can only revoke pending invitations
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'Can only revoke pending invitations',
      );
    }

    await this.invitationsRepository.updateStatus(
      invitationId,
      InvitationStatus.REVOKED,
    );
  }

  async findByOrganization(
    organizationId: string,
    requestingUser: User,
  ): Promise<InvitationResponseDto[]> {
    // Verify requester is admin or member of the organization
    const membership = await this.organizationsRepository.findMembership(
      requestingUser.id,
      organizationId,
    );
    if (!membership) {
      throw new UnauthorizedException(
        'You must be a member of this organization to view invitations',
      );
    }

    const invitations =
      await this.invitationsRepository.findByOrganization(organizationId);
    return plainToInstance(InvitationResponseDto, invitations);
  }

  private generateSecureToken(): string {
    // Generate 32 bytes (256 bits) of random data and convert to hex
    return randomBytes(32).toString('hex');
  }
}
