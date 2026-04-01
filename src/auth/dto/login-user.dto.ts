import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    type: 'string',
    format: 'email',
  })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.trim())
  email: string;

  @ApiProperty({
    description:
      'Password of the user. Must be at least 8 characters long, contain at least 1 capital letter and 1 number',
    example: 'Password123',
    type: 'string',
    format: 'password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, {
    message: 'Password should contain at least 1 capital letter',
  })
  @Matches(/[0-9]/, { message: 'Password should contain at least 1 number' })
  password: string;
}
