import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { MembershipRole } from '../../organizations/entities/membership.entity.js';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(MembershipRole)
  @IsOptional()
  role?: MembershipRole;

  // Invitation expiration in hours (default: 7 days = 168 hours)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(720) // Max 30 days
  expiresInHours?: number;
}
