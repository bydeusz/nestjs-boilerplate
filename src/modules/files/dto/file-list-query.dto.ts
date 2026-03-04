import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileScope } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto';

export class FileListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(FileScope)
  scope?: FileScope;

  @IsOptional()
  @IsString()
  folder?: string;
}
