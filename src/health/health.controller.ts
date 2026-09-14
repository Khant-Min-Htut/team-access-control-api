import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('live')
  isLive() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  isReady() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
