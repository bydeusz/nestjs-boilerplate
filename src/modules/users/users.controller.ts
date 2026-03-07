import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { PaginatedResult } from '../../common/interfaces';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@Roles(Role.Admin)
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ operationId: 'UserCreate' })
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ operationId: 'UserGetList' })
  @Get()
  @Roles(Role.Admin, Role.User)
  @CacheTTL(30000)
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ operationId: 'UserGet' })
  @Get(':id')
  @Roles(Role.Admin, Role.User)
  @CacheTTL(60000)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') currentUserId: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ): Promise<UserResponseDto> {
    if (!isAdmin && currentUserId !== id) {
      throw new ForbiddenException(
        'You can only access your own user details.',
      );
    }

    return this.usersService.findOne(id);
  }

  @ApiOperation({ operationId: 'UserUpdate' })
  @Patch(':id')
  @Roles(Role.Admin, Role.User)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('sub') currentUserId: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ): Promise<UserResponseDto> {
    const isAdminValue = updateUserDto.isAdmin;
    const isAdminUpdateRequested = typeof isAdminValue === 'boolean';
    const organisationIdsValue = updateUserDto.organisationIds;
    const organisationUpdateRequested = Array.isArray(organisationIdsValue);

    if (isAdminUpdateRequested || organisationUpdateRequested) {
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only admins can change isAdmin or organisationIds.',
        );
      }

      return this.usersService.updateAdminRoleForOrganisationUser(
        id,
        currentUserId,
        isAdminValue,
        organisationIdsValue,
      );
    }

    if (currentUserId !== id) {
      throw new ForbiddenException(
        'Only the user can update their own profile details.',
      );
    }

    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ operationId: 'UserDelete' })
  @Delete(':id')
  @Roles(Role.Admin, Role.User)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') currentUserId: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ): Promise<UserResponseDto> {
    if (!isAdmin && currentUserId !== id) {
      throw new ForbiddenException('You can only delete your own account.');
    }

    return this.usersService.remove(id);
  }
}
