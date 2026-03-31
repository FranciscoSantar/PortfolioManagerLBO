import { Controller, Post, Body } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from './decorators/public.decorator';
import { LoginResponseDto, RegisterResponseDto } from './dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered successfully', type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    return this.authService.register(createUserDto);
  }

  @ApiOperation({ summary: 'Login a user' })
  @ApiOkResponse({ description: 'User logged in successfully', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    return this.authService.login(loginUserDto);
  }
}
