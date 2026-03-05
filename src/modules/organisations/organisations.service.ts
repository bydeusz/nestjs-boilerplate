import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResult } from '../../common/interfaces';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../common/utils';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage';
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
        users: { connect: { id: userId } },
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
      users: { some: { id: userId } },
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

  async findOne(
    id: string,
    userId: string,
  ): Promise<OrganisationResponseDto> {
    const organisation = await this.prisma.organisation.findFirst({
      where: {
        id,
        users: { some: { id: userId } },
      },
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
    await this.assertUserIsMember(id, userId);

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: updateOrganisationDto,
      select: organisationPublicSelect,
    });

    await this.invalidateCache();

    return this.toOrganisationResponseDto(organisation);
  }

  async remove(
    id: string,
    userId: string,
  ): Promise<OrganisationResponseDto> {
    await this.assertUserIsMember(id, userId);

    const organisation = await this.prisma.organisation.delete({
      where: { id },
      select: organisationPublicSelect,
    });

    await this.invalidateCache();

    return this.toOrganisationResponseDto(organisation);
  }

  private async assertUserIsMember(
    organisationId: string,
    userId: string,
  ): Promise<void> {
    const organisation = await this.prisma.organisation.findFirst({
      where: {
        id: organisationId,
        users: { some: { id: userId } },
      },
      select: { id: true },
    });

    if (!organisation) {
      throw new ForbiddenException(
        'You do not have access to this organisation.',
      );
    }
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
