import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MembershipResponseDto } from './membership-response.dto.js';

export class OrganizationDetailsDto {
  @ApiProperty({ description: 'Organization ID (UUID)' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Organization name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  @Expose()
  slug: string;

  @ApiPropertyOptional({ description: 'Organization description' })
  @Expose()
  description: string | null;

  @ApiProperty({ description: 'Whether the organization is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Organization memberships', type: [MembershipResponseDto] })
  @Expose()
  @Type(() => MembershipResponseDto)
  memberships: MembershipResponseDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<OrganizationDetailsDto>) {
    Object.assign(this, partial);
  }
}
