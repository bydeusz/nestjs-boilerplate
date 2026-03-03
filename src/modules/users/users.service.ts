import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import type { Express } from 'express';
import { Prisma, User } from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResult } from '../../common/interfaces';
import { hashPassword } from '../../common/utils';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../common/utils';
import { StorageService } from '../storage';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

const userPublicSelect = {
  id: true,
  name: true,
  surname: true,
  email: true,
  isAdmin: true,
  organisationId: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { organisationId, password, ...rest } = createUserDto;
    const hashedPassword = await hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        ...(organisationId
          ? {
              organisation: {
                connect: { id: organisationId },
              },
            }
          : {}),
      },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return user;
  }

  async createFromRegistration(data: {
    name: string;
    surname: string;
    email: string;
    password: string;
  }): Promise<UserResponseDto> {
    const hashedPassword = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: hashedPassword,
        isAdmin: true,
      },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return user;
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const { skip, take } = buildPrismaSkipTake(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: userPublicSelect,
        skip,
        take,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: items,
      meta: buildPaginationMeta(query, total),
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.invalidateCache();
  }

  async uploadAvatar(
    id: string,
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const existingUser = await this.findOne(id);

    if (existingUser.avatarUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(
        existingUser.avatarUrl,
      );
      await this.storageService.delete(oldKey);
    }

    const uploadedFile = await this.storageService.upload(file, 'avatars', id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        avatarUrl: uploadedFile.url,
      },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return updatedUser;
  }

  async removeAvatar(id: string): Promise<UserResponseDto> {
    const existingUser = await this.findOne(id);

    if (existingUser.avatarUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(
        existingUser.avatarUrl,
      );
      await this.storageService.delete(oldKey);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        avatarUrl: null,
      },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return updatedUser;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    await this.findOne(id);

    const { organisationId, password, ...rest } = updateUserDto;
    const hashedPassword = password ? await hashPassword(password) : undefined;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        ...(organisationId
          ? {
              organisation: {
                connect: { id: organisationId },
              },
            }
          : {}),
      },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return user;
  }

  async remove(id: string): Promise<UserResponseDto> {
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return user;
  }
}
