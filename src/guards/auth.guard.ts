import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { CONSTANT_DECORATOR } from 'src/constants/decorator.contant';
import { CONSTANT_STRATEGY } from 'src/constants/strategy.constant';

@Injectable()
export class JwtAuthGuard extends AuthGuard(CONSTANT_STRATEGY.AUTH_GUARD) {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(private reflector: Reflector) {
    super();
  }

  // Before handle request
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(CONSTANT_DECORATOR.PUBLIC, context.getHandler());
    this.logger.debug('Start into guard - 0');

    //
    if (isPublic) {
      this.logger.debug('Public route');
      return true;
    }

    //
    return super.canActivate(context) as boolean;
  }

  // After handle request
  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    this.logger.debug('receive all information from request - 3');
    console.log('user:::', user);
    console.log('err:::', err);
    console.log('info:::', info);

    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        this.logger.debug(info);
        throw new UnauthorizedException('Token is expired');
      }
      throw new UnauthorizedException('Login again');
    }

    //
    delete user.iat;
    delete user.exp;

    //
    return user;
  }
}
