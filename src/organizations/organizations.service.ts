import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { OrganizationsRepository } from './organizations.repository.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationResponseDto } from './dto/organization-response.dto.js';
import { OrganizationDetailsDto } from './dto/organization-details.dto.js';
import { MembershipRole } from './entities/membership.entity.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditAction } from '../audit-log/entities/audit-log.entity.js';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<OrganizationResponseDto[]> {
    const organizations = await this.organizationsRepository.findAll();
    return plainToInstance(OrganizationResponseDto, organizations);
  }

  async findById(id: string): Promise<OrganizationDetailsDto> {
    const organization =
      await this.organizationsRepository.findByIdWithMemberships(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return plainToInstance(OrganizationDetailsDto, organization);
  }

  async findBySlug(slug: string): Promise<OrganizationDetailsDto> {
    const organization = await this.organizationsRepository.findBySlug(slug);
    if (!organization) {
      throw new NotFoundException(`Organization with slug '${slug}' not found`);
    }

    // Get full details with memberships
    const details = await this.organizationsRepository.findByIdWithMemberships(
      organization.id,
    );
    return plainToInstance(OrganizationDetailsDto, details);
  }

  async create(
    createOrganizationDto: CreateOrganizationDto,
    userId: string,
  ): Promise<OrganizationDetailsDto> {
    // Check if slug already exists
    const slugExists = await this.organizationsRepository.existsBySlug(
      createOrganizationDto.slug,
    );
    if (slugExists) {
      throw new ConflictException(
        `Organization with slug '${createOrganizationDto.slug}' already exists`,
      );
    }

    // Create organization
    const organization = await this.organizationsRepository.create(
      createOrganizationDto,
    );

    // Add creator as admin
    await this.organizationsRepository.createMembership(
      userId,
      organization.id,
      MembershipRole.ADMIN,
    );

    // Audit log
    await this.auditLogService.log({
      action: AuditAction.ORGANIZATION_CREATED,
      entityType: 'Organization',
      entityId: organization.id,
      userId,
      metadata: { name: organization.name, slug: organization.slug },
    });

    // Return with memberships
    const details = await this.organizationsRepository.findByIdWithMemberships(
      organization.id,
    );
    return plainToInstance(OrganizationDetailsDto, details);
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    userId: string,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsRepository.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Check if user is admin of this organization
    const membership = await this.organizationsRepository.findMembership(
      userId,
      id,
    );
    if (!membership || membership.role !== MembershipRole.ADMIN) {
      throw new ForbiddenException(
        'You must be an organization admin to update this organization',
      );
    }

    const updatedOrganization = await this.organizationsRepository.update(
      id,
      updateOrganizationDto,
    );
    if (!updatedOrganization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Audit log
    await this.auditLogService.log({
      action: AuditAction.ORGANIZATION_UPDATED,
      entityType: 'Organization',
      entityId: id,
      userId,
      metadata: { changes: updateOrganizationDto },
    });

    return plainToInstance(OrganizationResponseDto, updatedOrganization);
  }

  async remove(id: string, userId: string): Promise<void> {
    const organization = await this.organizationsRepository.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Check if user is admin of this organization
    const membership = await this.organizationsRepository.findMembership(
      userId,
      id,
    );
    if (!membership || membership.role !== MembershipRole.ADMIN) {
      throw new ForbiddenException(
        'You must be an organization admin to delete this organization',
      );
    }

    await this.organizationsRepository.remove(id);

    // Audit log
    await this.auditLogService.log({
      action: AuditAction.ORGANIZATION_DELETED,
      entityType: 'Organization',
      entityId: id,
      userId,
      metadata: { name: organization.name },
    });
  }

  async addMember(
    organizationId: string,
    userId: string,
    role: MembershipRole = MembershipRole.MEMBER,
    requestingUserId: string,
  ): Promise<void> {
    const organization =
      await this.organizationsRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Check if requesting user is admin
    const requestingMembership =
      await this.organizationsRepository.findMembership(
        requestingUserId,
        organizationId,
      );
    if (
      !requestingMembership ||
      requestingMembership.role !== MembershipRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You must be an organization admin to add members',
      );
    }

    // Check if user is already a member
    const existingMembership =
      await this.organizationsRepository.findMembership(userId, organizationId);
    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization');
    }

    await this.organizationsRepository.createMembership(
      userId,
      organizationId,
      role,
    );

    // Audit log
    await this.auditLogService.log({
      action: AuditAction.MEMBER_ADDED,
      entityType: 'Membership',
      entityId: organizationId,
      userId: requestingUserId,
      metadata: { addedUserId: userId, role },
    });
  }

  async removeMember(
    organizationId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<void> {
    const organization =
      await this.organizationsRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Check if requesting user is admin
    const requestingMembership =
      await this.organizationsRepository.findMembership(
        requestingUserId,
        organizationId,
      );
    if (
      !requestingMembership ||
      requestingMembership.role !== MembershipRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You must be an organization admin to remove members',
      );
    }

    // Find membership to remove
    const membershipToRemove =
      await this.organizationsRepository.findMembership(userId, organizationId);
    if (!membershipToRemove) {
      throw new NotFoundException('User is not a member of this organization');
    }

    await this.organizationsRepository.removeMembership(membershipToRemove.id);

    // Audit log
    await this.auditLogService.log({
      action: AuditAction.MEMBER_REMOVED,
      entityType: 'Membership',
      entityId: organizationId,
      userId: requestingUserId,
      metadata: { removedUserId: userId },
    });
  }

  async getUserOrganizations(
    userId: string,
  ): Promise<OrganizationResponseDto[]> {
    const memberships =
      await this.organizationsRepository.findMembershipsByUser(userId);
    const organizations = memberships.map((m) => m.organization);
    return plainToInstance(OrganizationResponseDto, organizations);
  }
}
