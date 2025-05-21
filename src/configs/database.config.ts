import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CONSTANT_CONFIG } from 'src/constants/config.constant';
import { CONSTANT_ENV } from 'src/constants/env.contant';

export default registerAs(
  CONSTANT_CONFIG.MYSQL,
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'test',
    synchronize: process.env.NODE_ENV === CONSTANT_ENV.DEV || false,
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    maxQueryExecutionTime: 3000, // 3s
    poolSize: 10,
  }),
);
