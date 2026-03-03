import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';

export class FileListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['USER', 'ORGANISATION'])
  scope?: 'USER' | 'ORGANISATION';

  @IsOptional()
  @IsString()
  folder?: string;
}
