import { BaseEntityDto } from '../../../common/dto';

export class UserResponseDto extends BaseEntityDto {
  name!: string;
  surname!: string;
  email!: string;
  isAdmin!: boolean;
  isActive!: boolean;
  organisationId!: string | null;
  avatarUrl!: string | null;
}
