import { IsOptional, IsString } from 'class-validator';

export class CreateOrganisationDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  postalCode!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  kvk?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  iban?: string;
}
