import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResult } from '../../common/interfaces';
import { hashPassword } from '../../common/utils';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../common/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

const userPublicSelect = {
  id: true,
  name: true,
  surname: true,
  email: true,
  isAdmin: true,
  organisationId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { organisationId, password, ...rest } = createUserDto;
    const hashedPassword = await hashPassword(password);

    return this.prisma.user.create({
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
  }

  async createFromRegistration(data: {
    name: string;
    surname: string;
    email: string;
    password: string;
  }): Promise<UserResponseDto> {
    const hashedPassword = await hashPassword(data.password);

    return this.prisma.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: hashedPassword,
        isAdmin: true,
      },
      select: userPublicSelect,
    });
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
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    await this.findOne(id);

    const { organisationId, password, ...rest } = updateUserDto;
    const hashedPassword = password ? await hashPassword(password) : undefined;

    return this.prisma.user.update({
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
  }

  async remove(id: string): Promise<UserResponseDto> {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
      select: userPublicSelect,
    });
  }
}
