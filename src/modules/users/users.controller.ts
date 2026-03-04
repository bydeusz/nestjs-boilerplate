import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  ForbiddenException,
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
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

  @Post(':id/avatar')
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
  uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.usersService.uploadAvatar(id, file);
  }

  @Delete(':id/avatar')
  removeAvatar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.removeAvatar(id);
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
