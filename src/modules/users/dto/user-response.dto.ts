import { BaseEntityDto } from '../../../common/dto';

export class UserResponseDto extends BaseEntityDto {
  name!: string;
  surname!: string;
  email!: string;
  isAdmin!: boolean;
  organisationId!: string | null;
  avatarUrl!: string | null;
}
