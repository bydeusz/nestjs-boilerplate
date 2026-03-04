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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('organisationId') organisationId: string | null,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, organisationId);
  }

  @Get()
  @Roles(Role.Admin, Role.User)
  @CacheTTL(30000)
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

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

  @Patch(':id')
  @Roles(Role.Admin, Role.User)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('sub') currentUserId: string,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ): Promise<UserResponseDto> {
    const isAdminUpdateRequested = typeof updateUserDto.isAdmin === 'boolean';

    if (isAdminUpdateRequested) {
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only admins can change the isAdmin flag.',
        );
      }

      const hasOtherFieldsBesidesIsAdmin = Object.keys(updateUserDto).some(
        (key) => key !== 'isAdmin',
      );

      if (hasOtherFieldsBesidesIsAdmin) {
        throw new ForbiddenException(
          'Admin updates via this route can only change isAdmin.',
        );
      }

      return this.usersService.update(id, updateUserDto);
    }

    if (currentUserId !== id) {
      throw new ForbiddenException(
        'Only the user can update their own profile details.',
      );
    }

    return this.usersService.update(id, updateUserDto);
  }

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
