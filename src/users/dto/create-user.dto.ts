import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => value.trim())
  firstName: string;

  @IsString()
  @MinLength(2)
  @Transform(({ value }) => value.trim())
  lastName: string;

  @IsEmail()
  @Transform(({ value }) => value.trim())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, {
    message: 'Password should contain at least 1 capital letter',
  })
  @Matches(/[0-9]/, { message: 'Password should contain at least 1 number' })
  password: string;
}
