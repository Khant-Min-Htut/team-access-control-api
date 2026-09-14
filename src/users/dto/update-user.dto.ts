import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'newemail@example.com', description: 'New email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Jane Doe', description: 'New display name', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'New password (8-128 characters)', minLength: 8, maxLength: 128 })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'New user role' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Whether the user is active' })
  @IsOptional()
  isActive?: boolean;
}
