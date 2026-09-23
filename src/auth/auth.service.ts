import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { LoginAttemptService } from '../common/services/login-attempt.service.js';
import { TokenBlacklistService } from '../common/services/token-blacklist.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenDto } from './dto/token.dto.js';
import { User } from '../users/entities/user.entity.js';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(
    signupDto: SignupDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenDto> {
    const existingUser = await this.usersRepository.findByEmail(
      signupDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(signupDto.password, salt);

    const user = await this.usersRepository.create({
      email: signupDto.email,
      name: signupDto.name,
      password: hashedPassword,
      role: signupDto.role,
    });

    const tokens = await this.generateTokens(user);

    await this.sessionsService.createSession(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    this.logger.log(`New user registered: ${user.email}`);
    return plainToInstance(TokenDto, tokens);
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenDto> {
    const isBlocked = await this.loginAttemptService.isBlocked(loginDto.email);
    if (isBlocked) {
      throw new BadRequestException(
        'Account temporarily locked due to too many failed attempts. Please try again later.',
      );
    }

    const requiredDelay = await this.loginAttemptService.getRequiredDelay(
      loginDto.email,
    );
    if (requiredDelay > 0) {
      await this.sleep(requiredDelay * 1000);
    }

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      await this.loginAttemptService.recordAttempt(loginDto.email, false);

      const remainingAttempts =
        await this.loginAttemptService.getRemainingAttempts(loginDto.email);

      this.logger.warn(
        `Failed login attempt for: ${loginDto.email} (${remainingAttempts} attempts remaining)`,
      );

      throw new UnauthorizedException('Invalid email or password');
    }

    await this.loginAttemptService.recordAttempt(loginDto.email, true);

    await this.usersRepository.update(user.id, { lastLoginAt: new Date() });

    const tokens = await this.generateTokens(user);

    await this.sessionsService.createSession(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    this.logger.log(`User logged in: ${user.email}`);
    return plainToInstance(TokenDto, tokens);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmailWithPassword(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async refreshTokens(
    user: User,
    sessionId?: string,
    currentRefreshToken?: string,
  ): Promise<TokenDto> {
    const tokens = await this.generateTokens(user);

    if (sessionId && currentRefreshToken) {
      await this.sessionsService.updateSessionToken(
        sessionId,
        tokens.refreshToken,
      );
    }

    return plainToInstance(TokenDto, tokens);
  }

  async logout(
    userId: string,
    sessionId?: string,
    accessToken?: string,
  ): Promise<void> {
    if (sessionId) {
      await this.sessionsService.logout(sessionId, userId);
    }

    if (accessToken) {
      await this.tokenBlacklistService.blacklistToken(accessToken, 'logout');
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenBlacklistService.blacklistAllUserTokens(userId);

    await this.sessionsService.logoutAll(userId);

    this.logger.log(`User ${userId} logged out from all devices`);
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'default-access-secret',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'default-refresh-secret',
    );
    const accessExpiration = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
      '15m',
    );
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration as any,
      }),
      this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiration as any,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
