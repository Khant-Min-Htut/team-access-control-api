import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SessionsService } from './sessions.service.js';
import { SessionResponseDto } from './dto/session-response.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getMySessions(
    @CurrentUser() user: User,
  ): Promise<SessionResponseDto[]> {
    return this.sessionsService.getActiveSessions(user.id);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.sessionsService.revokeSession(sessionId, user.id);
    return { message: 'Session revoked successfully' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.sessionsService.logoutAll(user.id);
    return { message: 'Logged out from all sessions' };
  }
}
