import {
  CacheInterceptor,
  CacheTTL,
} from '@nestjs/cache-manager';
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
import { PaginationQueryDto } from '../../common/dto';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { PaginatedResult } from '../../common/interfaces';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@Roles(Role.Admin)
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @CacheTTL(30000)
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @CacheTTL(60000)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.remove(id);
  }
}
