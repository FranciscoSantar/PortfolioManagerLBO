import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { User } from "../../users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "src/users/users.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly userService: UsersService
  ) {

    const jwtSecret = config.get('jwtSecret');
    if (!jwtSecret) {
      throw new Error('Environment variable JWT_SECRET should be defined before running the app');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

  }

  async validate(payload: JwtPayload): Promise<{ id: string }> {
    let user;
    const { email } = payload

    try {
      user = await this.userService.findByEmailForLogin(email)
    } catch {
      throw new UnauthorizedException('Invalid Token')
    }

    return {
      id: user.id
    };
  }
}