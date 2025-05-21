import { createKeyv } from '@keyv/redis';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CacheableMemory } from 'cacheable';
import { RedisOptions } from 'ioredis';
import { Keyv } from 'keyv';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheConfig, DatabaseConfig } from './configs';
import { CONSTANT_CONFIG } from './constants/config.constant';
import { CONSTANT_ENV } from './constants/env.contant';
import { HttpExceptionFilter } from './exceptions/http.exception';
import { TypeOrmExceptionFilter } from './exceptions/typeOrm.exception';
import { JwtAuthGuard } from './guards/auth.guard';
import { AuthModule } from './routes/auth/auth.module';
import { CategoriesModule } from './routes/categories/categories.module';
import { ProductsModule } from './routes/products/products.module';
import { UsersModule } from './routes/users/users.module';
import { TokensModule } from './share/tokens/tokens.module';
import { JwtAuthStrategy } from './strategies/auth.strategy';

@Module({
  imports: [
    // Load config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === CONSTANT_ENV.DEV ? '.env.dev' : '.env',
      load: [DatabaseConfig, CacheConfig],
    }),

    // Load database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<TypeOrmModuleOptions>(CONSTANT_CONFIG.MYSQL);

        if (!config) {
          throw new Error('database configuration not found');
        }

        return config;
      },
    }),

    // Load cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<CacheModuleOptions> => {
        const config = configService.get<RedisOptions>(CONSTANT_CONFIG.REDIS);

        if (!config) {
          throw new Error('Cache configuration not found');
        }

        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            createKeyv(`redis://${config.host}:${config.port}`),
          ],
        };
      },
    }),

    // Modules
    ProductsModule,
    UsersModule,
    TokensModule,
    CategoriesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtAuthStrategy,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ClassSerializerInterceptor,
    // },
    {
      provide: APP_FILTER,
      useClass: TypeOrmExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD, // toàn bộ ứng trừ Public()
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
