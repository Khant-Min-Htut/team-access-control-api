import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../sessions/redis.service.js';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Add a token to the blacklist
   */
  async blacklistToken(token: string, reason?: string): Promise<void> {
    const key = `blacklist:token:${token}`;
    const ttl = this.configService.get<number>(
      'BLACKLIST_TOKEN_TTL',
      7 * 24 * 60 * 60, // 7 days in seconds
    );

    await this.redisService.set(
      key,
      JSON.stringify({
        blacklistedAt: new Date().toISOString(),
        reason: reason || 'logout',
      }),
      ttl,
    );

    this.logger.debug(`Token blacklisted: ${reason || 'logout'}`);
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:token:${token}`;
    return this.redisService.exists(key);
  }

  /**
   * Blacklist all tokens for a user (logout from all devices)
   */
  async blacklistAllUserTokens(userId: string): Promise<void> {
    const key = `blacklist:user:${userId}`;
    const ttl = this.configService.get<number>(
      'BLACKLIST_TOKEN_TTL',
      7 * 24 * 60 * 60,
    );

    // Store the timestamp - any token issued before this should be rejected
    await this.redisService.set(
      key,
      new Date().toISOString(),
      ttl,
    );

    this.logger.log(`All tokens blacklisted for user: ${userId}`);
  }

  /**
   * Check if a token should be rejected based on user-level blacklist
   */
  async isUserTokenRevoked(
    userId: string,
    tokenIssuedAt: Date,
  ): Promise<boolean> {
    const key = `blacklist:user:${userId}`;
    const blacklistTimestamp = await this.redisService.get(key);

    if (!blacklistTimestamp) {
      return false;
    }

    // If token was issued before the blacklist, it's revoked
    return tokenIssuedAt < new Date(blacklistTimestamp);
  }

  /**
   * Remove a specific token from blacklist (for testing/debugging)
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = `blacklist:token:${token}`;
    await this.redisService.del(key);
  }

  /**
   * Get blacklist info for a token
   */
  async getBlacklistInfo(
    token: string,
  ): Promise<{ blacklistedAt: string; reason: string } | null> {
    const key = `blacklist:token:${token}`;
    const data = await this.redisService.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }
}
