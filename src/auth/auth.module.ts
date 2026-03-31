import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt'
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const jwtSecret = config.get('jwtSecret');
        const jwtExpireTime = config.get('jwtExpireTime');
        if (!jwtSecret) {
          throw new Error('Environment variable JWT_SECRET should be defined before running the app')
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: jwtExpireTime
          }
        }
      },
    }),

    ConfigModule,
    UsersModule
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AuthService,
    JwtStrategy],
  exports: [JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule { }
