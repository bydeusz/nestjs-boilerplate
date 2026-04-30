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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  detectMimeFromBuffer,
  isAllowedUploadMimeType,
} from './utils/file-validation.util';

@Controller('files')
@ApiTags('Files')
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ operationId: 'FileUpload' })
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
        validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_SIZE_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    const scope = this.resolveScope(params.scope);
    await this.assertUploadAccess(scope, params.ownerId, userId, isAdmin);
    this.assertSafeUpload(file);

    return this.filesService.upload(
      scope,
      params.ownerId,
      userId,
      params.folder,
      file,
      query.replace ?? false,
    );
  }

  @ApiOperation({ operationId: 'FileReplace' })
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
        validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_SIZE_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    const scope = this.resolveScope(params.scope);
    await this.assertUploadAccess(scope, params.ownerId, userId, isAdmin);
    this.assertSafeUpload(file);

    return this.filesService.upload(
      scope,
      params.ownerId,
      userId,
      params.folder,
      file,
      true,
    );
  }

  @ApiOperation({ operationId: 'FileGetList' })
  @Get()
  findAll(
    @CurrentUser('isAdmin') isAdmin: boolean,
    @Query() query: FileListQueryDto,
  ): Promise<PaginatedResult<FileResponseDto>> {
    void isAdmin;
    return this.filesService.findAllForUser(query);
  }

  @ApiOperation({ operationId: 'FileGet' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ): Promise<FileResponseDto> {
    void isAdmin;
    return this.filesService.findOne(id);
  }

  @ApiOperation({ operationId: 'FileDelete' })
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

  private assertSafeUpload(file: Express.Multer.File): void {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('File size cannot exceed 5MB.');
    }

    if (!isAllowedUploadMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type. Allowed: ${ALLOWED_UPLOAD_MIME_TYPES.join(', ')}.`,
      );
    }

    const detectedMime = detectMimeFromBuffer(file.buffer);
    if (!detectedMime) {
      throw new BadRequestException(
        'File contents do not match a supported image format.',
      );
    }

    if (detectedMime !== file.mimetype) {
      throw new BadRequestException(
        'Declared content type does not match file contents.',
      );
    }
  }
}
