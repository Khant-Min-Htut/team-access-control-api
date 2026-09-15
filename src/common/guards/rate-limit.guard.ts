import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RedisService } from '../../sessions/redis.service.js';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no rate limit decorator, allow access
    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Generate rate limit key
    const key = this.generateKey(request, rateLimitOptions);

    // Get current request count
    const currentCount = await this.redisService.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    // Check if blocked
    const blockKey = `${key}:blocked`;
    const isBlocked = await this.redisService.exists(blockKey);
    if (isBlocked) {
      const ttl = await this.redisService.ttl(blockKey);
      response.setHeader('Retry-After', ttl.toString());
      throw new HttpException(
        rateLimitOptions.message || 'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check if limit exceeded
    if (count >= rateLimitOptions.maxRequests) {
      // Apply block duration if specified
      if (rateLimitOptions.blockDuration) {
        await this.redisService.set(
          blockKey,
          '1',
          rateLimitOptions.blockDuration,
        );
      }

      // Set rate limit headers
      response.setHeader('X-RateLimit-Limit', rateLimitOptions.maxRequests.toString());
      response.setHeader('X-RateLimit-Remaining', '0');
      response.setHeader('X-RateLimit-Reset', this.getResetTime(rateLimitOptions.windowMs).toString());

      throw new HttpException(
        rateLimitOptions.message || 'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    const newCount = count + 1;
    // Always set with TTL to ensure the window resets properly
    const ttlSeconds = Math.ceil(rateLimitOptions.windowMs / 1000);
    await this.redisService.set(key, newCount.toString(), ttlSeconds);

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', rateLimitOptions.maxRequests.toString());
    response.setHeader('X-RateLimit-Remaining', (rateLimitOptions.maxRequests - newCount).toString());
    response.setHeader('X-RateLimit-Reset', this.getResetTime(rateLimitOptions.windowMs).toString());

    return true;
  }

  private generateKey(request: Request, options: RateLimitOptions): string {
    const prefix = options.keyPrefix || 'ratelimit';
    // Use x-forwarded-for for proxied requests, fallback to connection remoteAddress
    const forwarded = request.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim()
      || request.ip
      || request.socket.remoteAddress
      || 'unknown';
    const userId = (request.user as any)?.id || '';

    // Use IP for unauthenticated, userId for authenticated
    const identifier = userId || ip;
    return `${prefix}:${identifier}`;
  }

  private getResetTime(windowMs: number): number {
    return Math.ceil((Date.now() + windowMs) / 1000);
  }
}
