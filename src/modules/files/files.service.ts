import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Express } from 'express';
import { FileScope, Prisma } from '../../generated/prisma/client';
import { PaginatedResult } from '../../common/interfaces';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../common/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage';
import { FileListQueryDto, FileResponseDto } from './dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async uploadUserFile(
    userId: string,
    folder: string,
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    const cleanName = this.sanitizeFilename(file.originalname);
    const key = `uploads/${userId}/${folder}/${Date.now()}-${cleanName}`;

    await this.storageService.uploadWithKey(file, key);

    const record = await this.prisma.file.create({
      data: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        folder,
        scope: FileScope.USER,
        userId,
      },
    });

    return this.toResponseDto(record);
  }

  async uploadOrganisationFile(
    userId: string,
    organisationId: string,
    folder: string,
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    const cleanName = this.sanitizeFilename(file.originalname);
    const key = `uploads/${organisationId}/${folder}/${Date.now()}-${cleanName}`;

    await this.storageService.uploadWithKey(file, key);

    const record = await this.prisma.file.create({
      data: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        folder,
        scope: FileScope.ORGANISATION,
        userId,
        organisationId,
      },
    });

    return this.toResponseDto(record);
  }

  async findAllForUser(
    userId: string,
    organisationId: string | null,
    query: FileListQueryDto,
  ): Promise<PaginatedResult<FileResponseDto>> {
    const { skip, take } = buildPrismaSkipTake(query);

    const where: Prisma.FileWhereInput = {
      AND: [
        this.buildAccessFilter(userId, organisationId),
        ...(query.scope ? [{ scope: query.scope as FileScope }] : []),
        ...(query.folder ? [{ folder: query.folder }] : []),
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.file.count({ where }),
    ]);

    const data = await Promise.all(
      items.map((item) => this.toResponseDto(item)),
    );

    return {
      data,
      meta: buildPaginationMeta(query, total),
    };
  }

  async findOne(
    fileId: string,
    userId: string,
    organisationId: string | null,
  ): Promise<FileResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    this.assertAccess(file, userId, organisationId);

    return this.toResponseDto(file);
  }

  async deleteFile(
    fileId: string,
    userId: string,
    organisationId: string | null,
  ): Promise<FileResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    this.assertAccess(file, userId, organisationId);

    await this.storageService.delete(file.key);

    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return this.toResponseDto(file);
  }

  private assertAccess(
    file: { scope: FileScope; userId: string; organisationId: string | null },
    userId: string,
    organisationId: string | null,
  ): void {
    if (file.scope === FileScope.USER && file.userId === userId) return;
    if (
      file.scope === FileScope.ORGANISATION &&
      file.organisationId != null &&
      file.organisationId === organisationId
    )
      return;

    throw new ForbiddenException('You do not have access to this file.');
  }

  private buildAccessFilter(
    userId: string,
    organisationId: string | null,
  ): Prisma.FileWhereInput {
    const conditions: Prisma.FileWhereInput[] = [
      { scope: FileScope.USER, userId },
    ];

    if (organisationId) {
      conditions.push({
        scope: FileScope.ORGANISATION,
        organisationId,
      });
    }

    return { OR: conditions };
  }

  private async toResponseDto(file: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    key: string;
    folder: string;
    scope: FileScope;
    userId: string;
    organisationId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<FileResponseDto> {
    const downloadUrl = await this.storageService.getSignedUrl(file.key);

    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      folder: file.folder,
      scope: file.scope,
      userId: file.userId,
      organisationId: file.organisationId,
      downloadUrl,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
