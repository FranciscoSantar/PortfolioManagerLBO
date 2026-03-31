import * as bcrypt from 'bcrypt'

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';


import { CreateUserDto } from '../users/dto/create-user.dto';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResponseDto, RegisterResponseDto } from './dto/response.dto';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService
  ) { }

  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    try {
      const hashedPassword = bcrypt.hashSync(createUserDto.password, this.saltRounds);
      createUserDto.password = hashedPassword
      const user = await this.userService.create(createUserDto)

      const jwtPayload: JwtPayload = {
        id: user.id,
        email: user.email
      }

      const jwtToken = this.getJwtToken(jwtPayload)

      return {
        user,
        token: jwtToken
      }
    } catch (error) {
      handlePostgresError(error)
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    let user;
    const { password, email } = loginUserDto

    try {
      user = await this.userService.findByEmailForLogin(email);
    } catch {
      throw new UnauthorizedException(`Invalid Credentials`)
    }

    const passwordMatch = bcrypt.compareSync(password, user.password)

    if (!passwordMatch) {
      throw new UnauthorizedException(`Invalid Credentials`)
    }

    const jwtPayload: JwtPayload = {
      id: user.id,
      email
    }

    const jwtToken = this.getJwtToken(jwtPayload)
    return {
      token: jwtToken
    }
  }

  private getJwtToken(payload: JwtPayload): string {
    const jwtToken = this.jwtService.sign(payload);
    return jwtToken;
  }
}
