import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { redisStore } from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheConfig, DatabaseConfig } from './configs';
import { CONSTANT_CONFIG } from './constants/config.constants';
import { CONSTANT_ENV } from './constants/env.config';
import { CategoriesModule } from './routes/categories/categories.module';
import { ProductsModule } from './routes/products/products.module';
import { UsersModule } from './routes/users/users.module';
import { TokensModule } from './share/tokens/tokens.module';

@Module({
  imports: [
    // Load config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === CONSTANT_ENV.DEV ? '.env.dev' : '.env',
      load: [DatabaseConfig, CacheConfig],
    }),

    // Load database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<TypeOrmModuleOptions>(
          CONSTANT_CONFIG.MYSQL,
        );

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
      useFactory: async (
        configService: ConfigService,
      ): Promise<CacheModuleOptions> => {
        const config = configService.get(CONSTANT_CONFIG.REDIS);

        if (!config) {
          throw new Error('Cache configuration not found');
        }

        return {
          store: await redisStore({
            url: `redis://${config.host}:${config.port}`,
            ttl: 60 * 1000, // ms
          }),
        };
      },
    }),

    // Modules
    ProductsModule,
    UsersModule,
    TokensModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
