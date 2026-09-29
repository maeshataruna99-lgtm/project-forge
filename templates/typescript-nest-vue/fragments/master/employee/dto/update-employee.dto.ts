import { IsEmail, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateEmployeeDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  position?: string;
}
