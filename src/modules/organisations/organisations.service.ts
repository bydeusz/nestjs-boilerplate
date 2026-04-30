import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResult } from '../../common/interfaces';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../common/utils';
import { OrganisationRole, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage';
import { OrganisationAccessService } from './organisation-access.service';
import {
  CreateOrganisationDto,
  OrganisationResponseDto,
  UpdateOrganisationDto,
} from './dto';

const organisationPublicSelect = {
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
} satisfies Prisma.OrganisationSelect;
type OrganisationPublic = Prisma.OrganisationGetPayload<{
  select: typeof organisationPublicSelect;
}>;

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly organisationAccess: OrganisationAccessService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  async create(
    createOrganisationDto: CreateOrganisationDto,
    userId: string,
  ): Promise<OrganisationResponseDto> {
    const organisation = await this.prisma.organisation.create({
      data: {
        ...createOrganisationDto,
        members: {
          create: {
            userId,
            role: OrganisationRole.OWNER,
          },
        },
      },
      select: organisationPublicSelect,
    });

    await this.invalidateCache();

    return this.toOrganisationResponseDto(organisation);
  }

  async findAll(
    query: PaginationQueryDto,
    userId: string,
  ): Promise<PaginatedResult<OrganisationResponseDto>> {
    const { skip, take } = buildPrismaSkipTake(query);

    const where: Prisma.OrganisationWhereInput = {
      members: { some: { userId } },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organisation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: organisationPublicSelect,
        skip,
        take,
      }),
      this.prisma.organisation.count({ where }),
    ]);

    const data = await Promise.all(
      items.map((item) => this.toOrganisationResponseDto(item)),
    );

    return {
      data,
      meta: buildPaginationMeta(query, total),
    };
  }

  async findOne(id: string, userId: string): Promise<OrganisationResponseDto> {
    await this.organisationAccess.assertMembership(id, userId);

    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
      select: organisationPublicSelect,
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found.');
    }

    return this.toOrganisationResponseDto(organisation);
  }

  async update(
    id: string,
    updateOrganisationDto: UpdateOrganisationDto,
    userId: string,
  ): Promise<OrganisationResponseDto> {
    await this.organisationAccess.assertOwnership(id, userId);

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: updateOrganisationDto,
      select: organisationPublicSelect,
    });

    await this.invalidateCache();

    return this.toOrganisationResponseDto(organisation);
  }

  async remove(id: string, userId: string): Promise<OrganisationResponseDto> {
    await this.organisationAccess.assertOwnership(id, userId);

    const organisation = await this.prisma.organisation.delete({
      where: { id },
      select: organisationPublicSelect,
    });

    await this.invalidateCache();

    return this.toOrganisationResponseDto(organisation);
  }

  private async toOrganisationResponseDto(
    organisation: OrganisationPublic,
  ): Promise<OrganisationResponseDto> {
    const logoUrl = await this.resolveAssetUrl(organisation.logoUrl);

    return {
      ...organisation,
      logoUrl,
    };
  }

  private async resolveAssetUrl(
    assetRef: string | null,
  ): Promise<string | null> {
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
