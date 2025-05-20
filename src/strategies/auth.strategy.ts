import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CONSTANT_STRATEGY } from 'src/constants/strategy.constant';
import { CONSTANT_TOKEN } from 'src/constants/token.constant';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, CONSTANT_STRATEGY.AUTH_GUARD) {
  private readonly logger = new Logger(JwtAuthStrategy.name);
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req.cookies[CONSTANT_TOKEN.TOKEN]]),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_ACCESS_KEY,
    });
    // this.logger.debug('verify token - 1'); // Not into
  }

  //
  validate(payload: any) {
    this.logger.debug('verify token valid - 2');
    return payload; // Default user
  }
}
