import { BaseEntityDto } from '../../../common/dto';

export class OrganisationResponseDto extends BaseEntityDto {
  name!: string;
  address!: string;
  postalCode!: string;
  city!: string;
  kvk!: string | null;
  vatNumber!: string | null;
  iban!: string | null;
  logoUrl!: string | null;
}
