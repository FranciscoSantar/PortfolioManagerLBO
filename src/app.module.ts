import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { AssetsModule } from './assets/assets.module';
import { AssetTypesModule } from './asset_types/asset_types.module';
import { TransactionsModule } from './transactions/transactions.module';
import { YahooFinanceModule } from './yahoo-finance/yahoo-finance.module';
import { SeedModule } from './seed/seed.module';
import { AuthModule } from './auth/auth.module';
import { PortfolioAssetsModule } from './portfolio-assets/portfolio-assets.module';
import { ReportsModule } from './reports/reports.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<boolean>('isProd');

        return {
          pinoHttp: {
            level: isProd ? 'info' : 'info',
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss',
                  },
                },
            autoLogging: false,
            customProps: (req, res) => ({
              http: {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
              },
            }),
            serializers: {
              req: () => undefined,
              res: () => undefined,
            },
          },
        };
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cacheHost = config.get<string>('cache.host');
        const cachePort = config.get<string>('cache.port');
        return {
          stores: [new KeyvRedis(`redis://${cacheHost}:${cachePort}`)],
        };
      },
    }),
    UsersModule,
    PortfoliosModule,
    AssetsModule,
    AssetTypesModule,
    TransactionsModule,
    YahooFinanceModule,
    SeedModule,
    AuthModule,
    PortfolioAssetsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
