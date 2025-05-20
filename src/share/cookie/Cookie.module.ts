import { Module } from '@nestjs/common';
import { CookieService } from './Cookie.service';

@Module({
  imports: [],
  providers: [CookieService],
  exports: [CookieService],
})
export class CookieModule {}
