import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests in the window
  message?: string; // Custom error message
  keyPrefix?: string; // Custom key prefix for Redis
  skipSuccessfulRequests?: boolean; // Only count failed requests
  blockDuration?: number; // Block duration in seconds after exceeding limit
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

// Pre-defined rate limits for common use cases
export const LoginRateLimit = () =>
  RateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 15,
    message: 'Too many login attempts, please try again later',
    keyPrefix: 'login',
    blockDuration: 15 * 60, // Block for 15 minutes
  });

export const SignupRateLimit = () =>
  RateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 15, // 3 signups
    message: 'Too many signup attempts, please try again later',
    keyPrefix: 'signup',
  });

export const RefreshRateLimit = () =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 refreshes
    message: 'Too many token refresh attempts',
    keyPrefix: 'refresh',
  });

export const ApiRateLimit = () =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests
    message: 'Too many requests, please try again later',
    keyPrefix: 'api',
  });

export const InvitationRateLimit = () =>
  RateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 invitations
    message: 'Too many invitation attempts',
    keyPrefix: 'invitation',
  });
