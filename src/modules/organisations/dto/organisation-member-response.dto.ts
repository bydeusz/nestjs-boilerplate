import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityDto } from '../../../common/dto';
import { OrganisationRole } from '../../../generated/prisma/client';
import { UserResponseDto } from '../../users/dto';

export class OrganisationMemberResponseDto extends BaseEntityDto {
  userId!: string;
  organisationId!: string;

  @ApiProperty({ enum: OrganisationRole, enumName: 'OrganisationRole' })
  role!: OrganisationRole;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
