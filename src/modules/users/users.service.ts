import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '../../generated/prisma/client';
import { hashPassword } from '../../common/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async create(createUserDto: CreateUserDto) {
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
  }) {
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

  findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: userPublicSelect,
    });
  }

  async findOne(id: string) {
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

  async update(id: string, updateUserDto: UpdateUserDto) {
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

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
      select: userPublicSelect,
    });
  }
}
