import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MembershipRole } from '../entities/membership.entity.js';

export class MembershipResponseDto {
  @ApiProperty({ description: 'Membership ID (UUID)' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID (UUID)' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Organization ID (UUID)' })
  @Expose()
  organizationId: string;

  @ApiProperty({ enum: MembershipRole, description: 'Member role' })
  @Expose()
  role: MembershipRole;

  @ApiProperty({ description: 'Whether the membership is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<MembershipResponseDto>) {
    Object.assign(this, partial);
  }
}
