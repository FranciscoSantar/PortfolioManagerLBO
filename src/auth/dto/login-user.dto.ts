import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginUserDto {
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
