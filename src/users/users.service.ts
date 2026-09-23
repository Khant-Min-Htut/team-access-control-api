import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersRepository } from './users.repository.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserRole } from './entities/user.entity.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditAction } from '../audit-log/entities/audit-log.entity.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();
    return plainToInstance(UserResponseDto, users);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return plainToInstance(UserResponseDto, user);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    return plainToInstance(UserResponseDto, user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const exists = await this.usersRepository.existsByEmail(
      createUserDto.email,
    );
    if (exists) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }

    const user = await this.usersRepository.create({
      ...createUserDto,
      role: createUserDto.role || UserRole.MEMBER,
    });

    await this.auditLogService.log({
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, name: user.name },
    });

    return plainToInstance(UserResponseDto, user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.usersRepository.existsByEmail(
        updateUserDto.email,
        id,
      );
      if (emailExists) {
        throw new ConflictException(
          `User with email ${updateUserDto.email} already exists`,
        );
      }
    }

    const updatedUser = await this.usersRepository.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.auditLogService.log({
      action: AuditAction.USER_UPDATED,
      entityType: 'User',
      entityId: id,
      metadata: { changes: updateUserDto },
    });

    return plainToInstance(UserResponseDto, updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.usersRepository.remove(id);

    await this.auditLogService.log({
      action: AuditAction.USER_DELETED,
      entityType: 'User',
      entityId: id,
      metadata: { email: user.email },
    });
  }
}
