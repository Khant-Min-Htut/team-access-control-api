import { Module, Global } from '@nestjs/common';
import { RateLimitGuard } from './guards/rate-limit.guard.js';
import { LoginAttemptService } from './services/login-attempt.service.js';
import { TokenBlacklistService } from './services/token-blacklist.service.js';

@Global()
@Module({
  providers: [RateLimitGuard, LoginAttemptService, TokenBlacklistService],
  exports: [RateLimitGuard, LoginAttemptService, TokenBlacklistService],
})
export class CommonModule {}
