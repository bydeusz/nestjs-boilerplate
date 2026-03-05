import { IsBoolean, IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  surname!: string;

  @IsEmail()
  email!: string;

  @IsBoolean()
  isAdmin!: boolean;
}
