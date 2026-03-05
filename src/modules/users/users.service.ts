import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Prisma, User } from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResult } from '../../common/interfaces';
import { generatePassword, hashPassword } from '../../common/utils';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../common/utils';
import { MAIL_JOB_SEND, QueueService } from '../queue';
import { StorageService } from '../storage';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

const userPublicSelect = {
  id: true,
  name: true,
  surname: true,
  email: true,
  isAdmin: true,
  isActive: true,
  organisationId: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
type UserPublic = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly storageService: StorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  async create(
    createUserDto: CreateUserDto,
    organisationId: string | null,
  ): Promise<UserResponseDto> {
    const plainPassword = generatePassword();
    const hashedPassword = await hashPassword(plainPassword);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        isActive: true,
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

    await this.sendNewUserCredentialsEmail(
      user.email,
      user.name,
      plainPassword,
    );

    await this.invalidateCache();

    return this.toUserResponseDto(user);
  }

  private async sendNewUserCredentialsEmail(
    email: string,
    name: string,
    password: string,
  ): Promise<void> {
    await this.queueService.addMailJob(MAIL_JOB_SEND, {
      to: email,
      subject: 'Your account has been created',
      template: 'new-user-credentials',
      context: {
        name,
        password,
      },
    });
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
        isActive: false,
      },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return this.toUserResponseDto(user);
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

    const data = await Promise.all(
      items.map((item) => this.toUserResponseDto(item)),
    );

    return {
      data,
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

    return this.toUserResponseDto(user);
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

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
      },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return this.toUserResponseDto(user);
  }

  async remove(id: string): Promise<UserResponseDto> {
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
      select: userPublicSelect,
    });

    await this.invalidateCache();

    return this.toUserResponseDto(user);
  }

  private async toUserResponseDto(user: UserPublic): Promise<UserResponseDto> {
    const avatarUrl = await this.resolveAssetUrl(user.avatarUrl);

    return {
      ...user,
      avatarUrl,
    };
  }

  private async resolveAssetUrl(assetRef: string | null): Promise<string | null> {
    if (!assetRef) {
      return null;
    }

    const key = this.storageService.extractKeyFromUrl(assetRef);

    try {
      return await this.storageService.getSignedUrl(key);
    } catch {
      return null;
    }
  }
}
