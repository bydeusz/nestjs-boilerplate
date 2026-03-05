import { IsEnum, IsString } from 'class-validator';
import { FileScope } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto';

export class FileListQueryDto extends PaginationQueryDto {
  @IsEnum(FileScope)
  scope!: FileScope;

  @IsString()
  folder!: string;

  @IsString()
  mimeType!: string;
}
