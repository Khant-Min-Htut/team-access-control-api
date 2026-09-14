import { Expose } from 'class-transformer';
import { MembershipRole } from '../../organizations/entities/membership.entity.js';

export class ValidatedInvitationDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  role: MembershipRole;

  @Expose()
  organizationName: string;

  @Expose()
  organizationSlug: string;

  @Expose()
  invitedByName: string;

  @Expose()
  expiresAt: Date;

  constructor(partial: Partial<ValidatedInvitationDto>) {
    Object.assign(this, partial);
  }
}
