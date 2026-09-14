import { Expose, Type } from 'class-transformer';
import { PermissionResponseDto } from './permission-response.dto.js';

export class RoleResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  isSystem: boolean;

  @Expose()
  @Type(() => PermissionResponseDto)
  permissions: PermissionResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<RoleResponseDto>) {
    Object.assign(this, partial);
  }
}
