import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TokenDto {
  @ApiProperty({ description: 'JWT access token' })
  @Expose()
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  @Expose()
  refreshToken: string;

  constructor(partial: Partial<TokenDto>) {
    Object.assign(this, partial);
  }
}
