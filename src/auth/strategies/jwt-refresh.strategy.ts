import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { UsersRepository } from '../../users/users.repository.js';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret'),
      passReqToCallback: true,
    };
    super(options);
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer', '').trim();
    const user = await this.usersRepository.findByIdWithRefreshToken(
      payload.sub,
    );

    if (!user || !user.refreshToken || !user.isActive) {
      throw new UnauthorizedException('User not found, inactive, or invalid refresh token');
    }

    // Verify the refresh token matches
    if (user.refreshToken !== token) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    return user;
  }
}
