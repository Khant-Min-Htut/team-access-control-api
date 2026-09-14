import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity.js';
import { Membership, MembershipRole } from './entities/membership.entity.js';

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  // Organization methods
  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find();
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({ where: { id } });
  }

  async findByIdWithMemberships(id: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { id },
      relations: {
        memberships: {
          user: true,
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({ where: { slug } });
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const organization = this.organizationRepository.create(data);
    return this.organizationRepository.save(organization);
  }

  async update(
    id: string,
    data: Partial<Organization>,
  ): Promise<Organization | null> {
    await this.organizationRepository.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.organizationRepository.delete(id);
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const query = this.organizationRepository
      .createQueryBuilder('org')
      .where('org.slug = :slug', { slug });

    if (excludeId) {
      query.andWhere('org.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  // Membership methods
  async createMembership(
    userId: string,
    organizationId: string,
    role: MembershipRole = MembershipRole.MEMBER,
  ): Promise<Membership> {
    const membership = this.membershipRepository.create({
      userId,
      organizationId,
      role,
    });
    return this.membershipRepository.save(membership);
  }

  async findMembership(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null> {
    return this.membershipRepository.findOne({
      where: { userId, organizationId },
    });
  }

  async findMembershipsByOrganization(
    organizationId: string,
  ): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { organizationId },
      relations: {
        user: true,
      },
    });
  }

  async findMembershipsByUser(userId: string): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { userId },
      relations: {
        organization: true,
      },
    });
  }

  async updateMembership(
    id: string,
    data: Partial<Membership>,
  ): Promise<Membership | null> {
    await this.membershipRepository.update(id, data);
    return this.membershipRepository.findOne({ where: { id } });
  }

  async removeMembership(id: string): Promise<void> {
    await this.membershipRepository.delete(id);
  }
}
