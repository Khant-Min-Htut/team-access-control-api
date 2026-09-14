import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenDto } from './dto/token.dto.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import {
  LoginRateLimit,
  SignupRateLimit,
  RefreshRateLimit,
} from '../common/decorators/rate-limit.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @SignupRateLimit()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: 'Account created successfully', type: TokenDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async signup(
    @Body() signupDto: SignupDto,
    @Req() req: Request,
  ): Promise<TokenDto> {
    return this.authService.signup(
      signupDto,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Public()
  @LoginRateLimit()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokenDto })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<TokenDto> {
    return this.authService.login(
      loginDto,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Public()
  @RefreshRateLimit()
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: TokenDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<TokenDto> {
    const sessionId = (req as any).sessionId;
    const currentRefreshToken = (req as any).currentRefreshToken;
    return this.authService.refreshTokens(
      user,
      sessionId,
      currentRefreshToken,
    );
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const sessionId = (req as any).sessionId;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(user.id, sessionId, accessToken);
    return { message: 'Logged out successfully' };
  }
}
