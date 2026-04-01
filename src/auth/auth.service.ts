import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResponseDto, RegisterResponseDto } from './dto/response.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    try {
      const hashedPassword = bcrypt.hashSync(
        createUserDto.password,
        this.saltRounds,
      );
      createUserDto.password = hashedPassword;
      const user = await this.userService.create(createUserDto);

      const jwtPayload: JwtPayload = {
        id: user.id,
        email: user.email,
      };

      const jwtToken = this.getJwtToken(jwtPayload);

      this.logger.info(
        {
          userId: user.id,
          email: user.email,
        },
        'User registered successfully',
      );

      return {
        user,
        token: jwtToken,
      };
    } catch (error: unknown) {
      this.logger.error(
        {
          email: createUserDto.email,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error during user registration',
      );
      handlePostgresError(error);
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    let user: User;
    const { password, email } = loginUserDto;

    try {
      user = await this.userService.findByEmailForLogin(email);
    } catch {
      this.logger.warn({ email }, 'Failed login because of non-existing email');
      throw new UnauthorizedException(`Invalid Credentials`);
    }

    try {
      const passwordMatch = bcrypt.compareSync(password, user.password);

      if (!passwordMatch) {
        this.logger.warn({ email }, 'Failed login because of invalid password');
        throw new UnauthorizedException(`Invalid Credentials`);
      }

      const jwtPayload: JwtPayload = {
        id: user.id,
        email,
      };

      const jwtToken = this.getJwtToken(jwtPayload);
      this.logger.info(
        {
          userId: user.id,
          email: user.email,
        },
        'User logged in successfully',
      );

      return {
        token: jwtToken,
      };
    } catch (error: unknown) {
      this.logger.error(
        {
          email,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error during user login',
      );
      handlePostgresError(error);
    }
  }

  private getJwtToken(payload: JwtPayload): string {
    const jwtToken = this.jwtService.sign(payload);
    return jwtToken;
  }
}
