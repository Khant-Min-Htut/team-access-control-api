import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity.js';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID (UUID)' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User display name' })
  @Expose()
  name: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  @Expose()
  role: UserRole;

  @ApiProperty({ description: 'Whether the user is active' })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  @Expose()
  lastLoginAt: Date | null;

  @ApiProperty({ description: 'Account creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
