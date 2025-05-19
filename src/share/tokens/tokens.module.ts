import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from './entities/token.entity';
import { TokensService } from './tokens.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity]), JwtModule],
  controllers: [],
  providers: [TokensService],
  exports: [TokensService, JwtModule],
})
export class TokensModule {}
