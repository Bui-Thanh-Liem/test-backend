import { Module } from '@nestjs/common';
import { CookieModule } from 'src/share/cookie/Cookie.module';
import { TokensModule } from 'src/share/tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategy-local/local.strategy';

@Module({
  imports: [UsersModule, TokensModule, CookieModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
