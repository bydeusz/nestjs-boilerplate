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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto';
import { CurrentUser } from '../../common/decorators';
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

  @ApiOperation({ operationId: 'OrganisationCreate' })
  @Post()
  create(
    @Body() createOrganisationDto: CreateOrganisationDto,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.create(createOrganisationDto, userId);
  }

  @ApiOperation({ operationId: 'OrganisationGetList' })
  @Get()
  @CacheTTL(30000)
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser('sub') userId: string,
  ): Promise<PaginatedResult<OrganisationResponseDto>> {
    return this.organisationsService.findAll(query, userId);
  }

  @ApiOperation({ operationId: 'OrganisationGet' })
  @Get(':id')
  @CacheTTL(60000)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.findOne(id, userId);
  }

  @ApiOperation({ operationId: 'OrganisationUpdate' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganisationDto: UpdateOrganisationDto,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.update(id, updateOrganisationDto, userId);
  }

  @ApiOperation({ operationId: 'OrganisationDelete' })
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.remove(id, userId);
  }
}
