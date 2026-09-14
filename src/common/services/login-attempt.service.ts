import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../sessions/redis.service.js';

export interface LoginAttemptInfo {
  count: number;
  lastAttempt: Date;
  isBlocked: boolean;
  blockedUntil?: Date;
}

@Injectable()
export class LoginAttemptService {
  private readonly logger = new Logger(LoginAttemptService.name);

  constructor(private readonly redisService: RedisService) {}

  // Progressive delays in seconds based on attempt count
  private readonly progressiveDelays = [
    0,       // 1st attempt: no delay
    0,       // 2nd attempt: no delay
    5,       // 3rd attempt: 5 seconds
    30,      // 4th attempt: 30 seconds
    60,      // 5th attempt: 1 minute
    300,     // 6th attempt: 5 minutes
    900,     // 7th+ attempts: 15 minutes
  ];

  private readonly maxAttempts = 10;
  private readonly lockoutDuration = 15 * 60; // 15 minutes in seconds

  async recordAttempt(email: string, success: boolean): Promise<void> {
    const key = `login:attempts:${email}`;

    if (success) {
      // Clear attempts on successful login
      await this.redisService.del(key);
      return;
    }

    // Get current attempt info
    const data = await this.redisService.get(key);
    let attemptInfo: LoginAttemptInfo;

    if (data) {
      attemptInfo = JSON.parse(data);
      attemptInfo.count++;
      attemptInfo.lastAttempt = new Date();
    } else {
      attemptInfo = {
        count: 1,
        lastAttempt: new Date(),
        isBlocked: false,
      };
    }

    // Check if should be blocked
    if (attemptInfo.count >= this.maxAttempts) {
      attemptInfo.isBlocked = true;
      attemptInfo.blockedUntil = new Date(
        Date.now() + this.lockoutDuration * 1000,
      );
      this.logger.warn(
        `Account locked due to too many failed attempts: ${email}`,
      );
    }

    // Store with TTL (longest possible block + buffer)
    const ttl = this.lockoutDuration + 60;
    await this.redisService.set(key, JSON.stringify(attemptInfo), ttl);
  }

  async getAttemptInfo(email: string): Promise<LoginAttemptInfo | null> {
    const key = `login:attempts:${email}`;
    const data = await this.redisService.get(key);

    if (!data) {
      return null;
    }

    const info: LoginAttemptInfo = JSON.parse(data);

    // Check if block has expired
    if (info.isBlocked && info.blockedUntil) {
      if (new Date() > new Date(info.blockedUntil)) {
        await this.redisService.del(key);
        return null;
      }
    }

    return info;
  }

  async isBlocked(email: string): Promise<boolean> {
    const info = await this.getAttemptInfo(email);
    return info?.isBlocked || false;
  }

  async getRequiredDelay(email: string): Promise<number> {
    const info = await this.getAttemptInfo(email);

    if (!info || info.isBlocked) {
      return 0;
    }

    // Get delay based on attempt count
    const delayIndex = Math.min(
      info.count - 1,
      this.progressiveDelays.length - 1,
    );
    return this.progressiveDelays[delayIndex];
  }

  async clearAttempts(email: string): Promise<void> {
    const key = `login:attempts:${email}`;
    await this.redisService.del(key);
  }

  async getRemainingAttempts(email: string): Promise<number> {
    const info = await this.getAttemptInfo(email);

    if (!info || info.isBlocked) {
      return 0;
    }

    return Math.max(0, this.maxAttempts - info.count);
  }
}
