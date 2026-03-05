import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
import { CurrentUser } from '../../common/decorators';
import { FileScope } from '../../generated/prisma/client';
import { PaginatedResult } from '../../common/interfaces';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FileListQueryDto,
  FileResponseDto,
  UploadFileParamsDto,
  UploadFileQueryDto,
} from './dto';
import { FilesService } from './files.service';

@Controller('files')
@ApiTags('Files')
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':scope/:ownerId/:folder')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async upload(
    @Param() params: UploadFileParamsDto,
    @Query() query: UploadFileQueryDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    const scope = this.resolveScope(params.scope);
    await this.assertUploadAccess(scope, params.ownerId, userId, isAdmin);
    this.assertFolderSpecificFileRules(params.folder, file);

    return this.filesService.upload(
      scope,
      params.ownerId,
      userId,
      params.folder,
      file,
      query.replace ?? false,
    );
  }

  @Put(':scope/:ownerId/:folder')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async replace(
    @Param() params: UploadFileParamsDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    const scope = this.resolveScope(params.scope);
    await this.assertUploadAccess(scope, params.ownerId, userId, isAdmin);
    this.assertFolderSpecificFileRules(params.folder, file);

    return this.filesService.upload(
      scope,
      params.ownerId,
      userId,
      params.folder,
      file,
      true,
    );
  }

  @Get()
  findAll(
    @CurrentUser('isAdmin') isAdmin: boolean,
    @Query() query: FileListQueryDto,
  ): Promise<PaginatedResult<FileResponseDto>> {
    void isAdmin;
    return this.filesService.findAllForUser(query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ): Promise<FileResponseDto> {
    void isAdmin;
    return this.filesService.findOne(id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ): Promise<FileResponseDto> {
    return this.filesService.deleteFile(id, userId, isAdmin);
  }

  private resolveScope(scope: string): FileScope {
    if (scope === 'user') {
      return FileScope.USER;
    }

    if (scope === 'organisation') {
      return FileScope.ORGANISATION;
    }

    throw new BadRequestException('Scope must be either user or organisation.');
  }

  private async assertUploadAccess(
    scope: FileScope,
    ownerId: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<void> {
    if (scope === FileScope.USER) {
      if (!isAdmin && ownerId !== currentUserId) {
        throw new ForbiddenException('You can only upload files for yourself.');
      }

      return;
    }

    const membership = await this.prisma.organisation.findFirst({
      where: {
        id: ownerId,
        users: { some: { id: currentUserId } },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You can only upload organisation files for organisations you belong to.',
      );
    }
  }

  private assertFolderSpecificFileRules(
    folder: string,
    file: Express.Multer.File,
  ): void {
    if (folder === 'avatar') {
      if (!/image\/(jpeg|png|webp)/.test(file.mimetype)) {
        throw new BadRequestException(
          'Avatar must be jpeg, png, or webp image.',
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Avatar file size cannot exceed 5MB.');
      }
    }

    if (folder === 'logo') {
      if (!/image\/(jpeg|png|webp|svg\+xml)/.test(file.mimetype)) {
        throw new BadRequestException(
          'Logo must be jpeg, png, webp, or svg image.',
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Logo file size cannot exceed 5MB.');
      }
    }
  }
}
