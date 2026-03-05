import { BaseEntityDto } from '../../../common/dto';

export class UserResponseDto extends BaseEntityDto {
  name!: string;
  surname!: string;
  email!: string;
  isAdmin!: boolean;
  isActive!: boolean;
  organisationIds!: string[];
  avatarUrl!: string | null;
}
