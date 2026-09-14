import { Expose } from 'class-transformer';

export class PermissionResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  resource: string;

  @Expose()
  action: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<PermissionResponseDto>) {
    Object.assign(this, partial);
  }
}
