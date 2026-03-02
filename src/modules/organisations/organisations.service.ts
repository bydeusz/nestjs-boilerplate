import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createOrganisationDto: CreateOrganisationDto) {
    return this.prisma.organisation.create({
      data: createOrganisationDto,
    });
  }

  findAll() {
    return this.prisma.organisation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found.');
    }

    return organisation;
  }

  async update(id: string, updateOrganisationDto: UpdateOrganisationDto) {
    await this.findOne(id);

    return this.prisma.organisation.update({
      where: { id },
      data: updateOrganisationDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.organisation.delete({
      where: { id },
    });
  }
}
