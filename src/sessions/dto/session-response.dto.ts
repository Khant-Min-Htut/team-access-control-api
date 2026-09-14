import { Expose } from 'class-transformer';

export class SessionResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  userAgent: string | null;

  @Expose()
  ipAddress: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  expiresAt: Date;

  @Expose()
  lastActivityAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<SessionResponseDto>) {
    Object.assign(this, partial);
  }
}
