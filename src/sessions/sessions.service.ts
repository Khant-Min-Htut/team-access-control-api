import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { SessionsRepository } from './sessions.repository.js';
import { RedisService } from './redis.service.js';
import { SessionResponseDto } from './dto/session-response.dto.js';
import { Session } from './entities/session.entity.js';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<Session> {
    // Check max sessions per user
    const maxPerUser = this.configService.get<number>(
      'session.maxPerUser',
      5,
    );
    const activeSessions =
      await this.sessionsRepository.countActiveByUserId(userId);

    // If at max, deactivate oldest session
    if (activeSessions >= maxPerUser) {
      const sessions =
        await this.sessionsRepository.findByUserId(userId);
      if (sessions.length > 0) {
        const oldestSession = sessions[sessions.length - 1];
        await this.deactivateSession(oldestSession.id);
        this.logger.log(
          `Deactivated oldest session for user ${userId} due to max sessions limit`,
        );
      }
    }

    // Calculate expiration from refresh token expiration
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
    const expiresAt = this.calculateExpiration(refreshExpiration);

    // Create session in database
    const session = await this.sessionsRepository.create({
      userId,
      refreshToken,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
      lastActivityAt: new Date(),
    });

    // Store session metadata in Redis for quick access
    await this.redisService.set(
      `session:${session.id}`,
      JSON.stringify({
        id: session.id,
        userId,
        userAgent,
        ipAddress,
        createdAt: session.createdAt,
      }),
      86400, // 24 hours TTL
    );

    // Add session to user's session set in Redis
    await this.redisService.sadd(`user:${userId}:sessions`, session.id);

    return session;
  }

  async getActiveSessions(userId: string): Promise<SessionResponseDto[]> {
    const sessions =
      await this.sessionsRepository.findByUserId(userId);
    return plainToInstance(
      SessionResponseDto,
      sessions.filter((s) => s.isActive && !s.isExpired),
    );
  }

  async validateSession(
    sessionId: string,
    refreshToken: string,
  ): Promise<Session> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session || !session.isActive) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.isExpired) {
      await this.deactivateSession(sessionId);
      throw new UnauthorizedException('Session expired');
    }

    if (session.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Update last activity
    await this.sessionsRepository.update(sessionId, {
      lastActivityAt: new Date(),
    });

    return session;
  }

  async updateSessionToken(
    sessionId: string,
    newRefreshToken: string,
  ): Promise<void> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionsRepository.update(sessionId, {
      refreshToken: newRefreshToken,
      lastActivityAt: new Date(),
    });

    // Update in Redis
    const cachedData = await this.redisService.get(`session:${sessionId}`);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      data.lastActivityAt = new Date().toISOString();
      await this.redisService.set(
        `session:${sessionId}`,
        JSON.stringify(data),
        86400,
      );
    }
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await this.deactivateSession(sessionId);
    this.logger.log(`User ${userId} logged out from session ${sessionId}`);
  }

  async logoutAll(userId: string): Promise<void> {
    // Get all session IDs from Redis
    const sessionIds = await this.redisService.smembers(
      `user:${userId}:sessions`,
    );

    // Deactivate all sessions in database
    await this.sessionsRepository.deactivateAllByUserId(userId);

    // Remove all sessions from Redis
    for (const sessionId of sessionIds) {
      await this.redisService.del(`session:${sessionId}`);
    }
    await this.redisService.del(`user:${userId}:sessions`);

    this.logger.log(`User ${userId} logged out from all sessions`);
  }

  async revokeSession(
    sessionId: string,
    requestingUserId: string,
  ): Promise<void> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== requestingUserId) {
      throw new UnauthorizedException(
        'You can only revoke your own sessions',
      );
    }

    await this.deactivateSession(sessionId);
    this.logger.log(
      `Session ${sessionId} revoked by user ${requestingUserId}`,
    );
  }

  private async deactivateSession(sessionId: string): Promise<void> {
    // Deactivate in database
    await this.sessionsRepository.deactivate(sessionId);

    // Get session to find userId
    const session = await this.sessionsRepository.findById(sessionId);

    // Remove from Redis
    await this.redisService.del(`session:${sessionId}`);
    if (session) {
      await this.redisService.srem(
        `user:${session.userId}:sessions`,
        sessionId,
      );
    }
  }

  private calculateExpiration(expirationString: string): Date {
    const now = new Date();
    const match = expirationString.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 7 days
      now.setDate(now.getDate() + 7);
      return now;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }

    return now;
  }

  async cleanupExpiredSessions(): Promise<void> {
    // Deactivate expired sessions in database
    await this.sessionsRepository.deactivateExpired();

    // Clean up old inactive sessions (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await this.sessionsRepository.deleteInactiveOlderThan(thirtyDaysAgo);

    this.logger.log('Cleaned up expired sessions');
  }
}
