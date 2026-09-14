import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationResponseDto } from './dto/organization-response.dto.js';
import { OrganizationDetailsDto } from './dto/organization-details.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  @ApiResponse({ status: 200, description: 'List of organizations', type: [OrganizationResponseDto] })
  async findAll(): Promise<OrganizationResponseDto[]> {
    return this.organizationsService.findAll();
  }

  @Get('my/organizations')
  @ApiOperation({ summary: 'List organizations for the current user' })
  @ApiResponse({ status: 200, description: 'User organizations', type: [OrganizationResponseDto] })
  async getMyOrganizations(
    @CurrentUser() user: User,
  ): Promise<OrganizationResponseDto[]> {
    return this.organizationsService.getUserOrganizations(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID with memberships' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization details', type: OrganizationDetailsDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationDetailsDto> {
    return this.organizationsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiParam({ name: 'slug', description: 'Organization slug' })
  @ApiResponse({ status: 200, description: 'Organization details', type: OrganizationDetailsDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<OrganizationDetailsDto> {
    return this.organizationsService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({ status: 201, description: 'Organization created', type: OrganizationDetailsDto })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: User,
  ): Promise<OrganizationDetailsDto> {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({ status: 200, description: 'Organization updated', type: OrganizationResponseDto })
  @ApiResponse({ status: 403, description: 'Not an admin of this organization' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @CurrentUser() user: User,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.update(id, updateOrganizationDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization deleted' })
  @ApiResponse({ status: 403, description: 'Not an admin of this organization' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.organizationsService.remove(id, user.id);
  }

  @Post(':id/members/:userId')
  @ApiOperation({ summary: 'Add a member to an organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to add' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 403, description: 'Not an admin of this organization' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.organizationsService.addMember(id, userId, undefined, user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to remove' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Not an admin of this organization' })
  @ApiResponse({ status: 404, description: 'Organization or member not found' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.organizationsService.removeMember(id, userId, user.id);
  }
}
