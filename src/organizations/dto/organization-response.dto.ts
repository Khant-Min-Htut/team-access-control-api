import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrganizationResponseDto {
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

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<OrganizationResponseDto>) {
    Object.assign(this, partial);
  }
}
