import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, InvitationStatus } from './entities/invitation.entity.js';

@Injectable()
export class InvitationsRepository {
  constructor(
    @InjectRepository(Invitation)
    private readonly repository: Repository<Invitation>,
  ) {}

  async findAll(): Promise<Invitation[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<Invitation | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return this.repository.findOne({ where: { token } });
  }

  async findByTokenWithRelations(token: string): Promise<Invitation | null> {
    return this.repository.findOne({
      where: { token },
      relations: {
        organization: true,
      },
    });
  }

  async findByEmailAndOrganization(
    email: string,
    organizationId: string,
  ): Promise<Invitation | null> {
    return this.repository.findOne({
      where: { email, organizationId },
    });
  }

  async findPendingByEmailAndOrganization(
    email: string,
    organizationId: string,
  ): Promise<Invitation | null> {
    return this.repository.findOne({
      where: {
        email,
        organizationId,
        status: InvitationStatus.PENDING,
      },
    });
  }

  async findByOrganization(organizationId: string): Promise<Invitation[]> {
    return this.repository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Invitation>): Promise<Invitation> {
    const invitation = this.repository.create(data);
    return this.repository.save(invitation);
  }

  async update(
    id: string,
    data: Partial<Invitation>,
  ): Promise<Invitation | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: InvitationStatus,
  ): Promise<void> {
    await this.repository.update(id, { status });
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async expireOldInvitations(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Invitation)
      .set({ status: InvitationStatus.EXPIRED })
      .where('status = :status', { status: InvitationStatus.PENDING })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
