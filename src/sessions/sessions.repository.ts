import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Session } from './entities/session.entity.js';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(Session)
    private readonly repository: Repository<Session>,
  ) {}

  async findById(id: string): Promise<Session | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return this.repository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    return this.repository.findOne({
      where: { refreshToken, isActive: true },
    });
  }

  async create(data: Partial<Session>): Promise<Session> {
    const session = this.repository.create(data);
    return this.repository.save(session);
  }

  async update(id: string, data: Partial<Session>): Promise<Session | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }

  async deactivateAllByUserId(userId: string): Promise<void> {
    await this.repository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async deactivateExpired(): Promise<void> {
    await this.repository.update(
      { isActive: true, expiresAt: LessThan(new Date()) },
      { isActive: false },
    );
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.repository.count({
      where: { userId, isActive: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteInactiveOlderThan(date: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('isActive = :isActive', { isActive: false })
      .andWhere('updatedAt < :date', { date })
      .execute();
  }
}
