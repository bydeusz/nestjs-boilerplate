import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { PaginationQueryDto } from '../../common/dto';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { PaginatedResult } from '../../common/interfaces';
import {
  CreateOrganisationDto,
  OrganisationResponseDto,
  UpdateOrganisationDto,
} from './dto';
import { OrganisationsService } from './organisations.service';

@Controller('organisations')
@Roles(Role.Admin)
@UseInterceptors(CacheInterceptor)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  create(
    @Body() createOrganisationDto: CreateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.create(createOrganisationDto);
  }

  @Get()
  @CacheTTL(30000)
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<OrganisationResponseDto>> {
    return this.organisationsService.findAll(query);
  }

  @Get(':id')
  @CacheTTL(60000)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganisationDto: UpdateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.update(id, updateOrganisationDto);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /image\/(jpeg|png|webp|svg\+xml)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.uploadLogo(id, file);
  }

  @Delete(':id/logo')
  removeLogo(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.removeLogo(id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.remove(id);
  }
}
