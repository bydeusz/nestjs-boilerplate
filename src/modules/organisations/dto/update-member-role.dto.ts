import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrganisationRole } from '../../../generated/prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: OrganisationRole, enumName: 'OrganisationRole' })
  @IsEnum(OrganisationRole)
  role!: OrganisationRole;
}
