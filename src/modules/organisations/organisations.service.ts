import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import type { Express } from 'express';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResult } from '../../common/interfaces';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../common/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage';
import {
  CreateOrganisationDto,
  OrganisationResponseDto,
  UpdateOrganisationDto,
} from './dto';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  async create(
    createOrganisationDto: CreateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    const organisation = await this.prisma.organisation.create({
      data: createOrganisationDto,
    });

    await this.invalidateCache();

    return organisation;
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<OrganisationResponseDto>> {
    const { skip, take } = buildPrismaSkipTake(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organisation.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          address: true,
          postalCode: true,
          city: true,
          kvk: true,
          vatNumber: true,
          iban: true,
          logoUrl: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take,
      }),
      this.prisma.organisation.count(),
    ]);

    return {
      data: items,
      meta: buildPaginationMeta(query, total),
    };
  }

  async findOne(id: string): Promise<OrganisationResponseDto> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found.');
    }

    return organisation;
  }

  async update(
    id: string,
    updateOrganisationDto: UpdateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    await this.findOne(id);

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: updateOrganisationDto,
    });

    await this.invalidateCache();

    return organisation;
  }

  async remove(id: string): Promise<OrganisationResponseDto> {
    await this.findOne(id);

    const organisation = await this.prisma.organisation.delete({
      where: { id },
    });

    await this.invalidateCache();

    return organisation;
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File,
  ): Promise<OrganisationResponseDto> {
    const existingOrganisation = await this.findOne(id);

    if (existingOrganisation.logoUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(
        existingOrganisation.logoUrl,
      );
      await this.storageService.delete(oldKey);
    }

    const uploadedFile = await this.storageService.upload(file, 'logos', id);

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: {
        logoUrl: uploadedFile.url,
      },
    });

    await this.invalidateCache();

    return organisation;
  }

  async removeLogo(id: string): Promise<OrganisationResponseDto> {
    const existingOrganisation = await this.findOne(id);

    if (existingOrganisation.logoUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(
        existingOrganisation.logoUrl,
      );
      await this.storageService.delete(oldKey);
    }

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: {
        logoUrl: null,
      },
    });

    await this.invalidateCache();

    return organisation;
  }
}
