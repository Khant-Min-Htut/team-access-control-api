import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity.js';
import { SessionsRepository } from './sessions.repository.js';
import { SessionsService } from './sessions.service.js';
import { SessionsController } from './sessions.controller.js';
import { RedisService } from './redis.service.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  controllers: [SessionsController],
  providers: [SessionsRepository, SessionsService, RedisService],
  exports: [SessionsService, RedisService],
})
export class SessionsModule {}
