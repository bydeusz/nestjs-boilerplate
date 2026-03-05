import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { PaginatedResult } from '../../common/interfaces';
import {
  CreateOrganisationDto,
  OrganisationResponseDto,
  UpdateOrganisationDto,
} from './dto';
import { OrganisationsService } from './organisations.service';

@Controller('organisations')
@ApiTags('Organisations')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  @Roles(Role.Admin)
  create(
    @Body() createOrganisationDto: CreateOrganisationDto,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.create(createOrganisationDto, userId);
  }

  @Get()
  @Roles(Role.Admin, Role.User)
  @CacheTTL(30000)
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser('sub') userId: string,
  ): Promise<PaginatedResult<OrganisationResponseDto>> {
    return this.organisationsService.findAll(query, userId);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.User)
  @CacheTTL(60000)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.findOne(id, userId);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganisationDto: UpdateOrganisationDto,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.update(id, updateOrganisationDto, userId);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.remove(id, userId);
  }
}
