import { Expose } from 'class-transformer';
import { InvitationStatus } from '../entities/invitation.entity.js';
import { MembershipRole } from '../../organizations/entities/membership.entity.js';

export class InvitationResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  status: InvitationStatus;

  @Expose()
  role: MembershipRole;

  @Expose()
  organizationId: string;

  @Expose()
  invitedByUserId: string;

  @Expose()
  expiresAt: Date;

  @Expose()
  acceptedAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<InvitationResponseDto>) {
    Object.assign(this, partial);
  }
}

export class InvitationWithTokenDto extends InvitationResponseDto {
  @Expose()
  token: string;

  constructor(partial: Partial<InvitationWithTokenDto>) {
    super(partial);
  }
}
