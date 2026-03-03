import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { CurrentUser } from '../../common/decorators';
import { PaginatedResult } from '../../common/interfaces';
import { FileListQueryDto, FileResponseDto } from './dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('user/:folder')
  @UseInterceptors(FileInterceptor('file'))
  uploadUserFile(
    @CurrentUser('sub') userId: string,
    @Param('folder') folder: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    return this.filesService.uploadUserFile(userId, folder, file);
  }

  @Post('organisation/:folder')
  @UseInterceptors(FileInterceptor('file'))
  uploadOrganisationFile(
    @CurrentUser('sub') userId: string,
    @CurrentUser('organisationId') organisationId: string | null,
    @Param('folder') folder: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    if (!organisationId) {
      throw new ForbiddenException(
        'You must belong to an organisation to upload organisation files.',
      );
    }

    return this.filesService.uploadOrganisationFile(
      userId,
      organisationId,
      folder,
      file,
    );
  }

  @Get()
  findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('organisationId') organisationId: string | null,
    @Query() query: FileListQueryDto,
  ): Promise<PaginatedResult<FileResponseDto>> {
    return this.filesService.findAllForUser(userId, organisationId, query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('organisationId') organisationId: string | null,
  ): Promise<FileResponseDto> {
    return this.filesService.findOne(id, userId, organisationId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('organisationId') organisationId: string | null,
  ): Promise<FileResponseDto> {
    return this.filesService.deleteFile(id, userId, organisationId);
  }
}
