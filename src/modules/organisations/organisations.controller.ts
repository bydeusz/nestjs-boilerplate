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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
@ApiTags('Organisations')
@ApiBearerAuth()
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

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.remove(id);
  }
}
