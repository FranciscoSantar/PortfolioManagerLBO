import { ApiProperty } from '@nestjs/swagger';
import { CreatedUserResponseDto } from 'src/users/dto/response-user.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT token for authentication',
    example: 'eyJhbGciOiJ...',
  })
  token: string;
}

export class RegisterResponseDto {
  @ApiProperty({ type: CreatedUserResponseDto })
  user: CreatedUserResponseDto;

  @ApiProperty({
    description: 'JWT token for authentication',
    example: 'eyJhbGciOiJ...',
  })
  token: string;
}
