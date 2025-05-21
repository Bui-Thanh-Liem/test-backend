import { Body, Controller, Headers, HttpStatus, NotFoundException, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseSuccess } from 'src/classes';
import { CONSTANT_TOKEN } from 'src/constants/token.constant';
import { Public } from 'src/decorators/public.decorator';
import { IUser } from 'src/interfaces/model/user.model';
import { CookieService } from 'src/share/cookie/Cookie.service';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LocalAuthGuard } from './strategy-local/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private cookieService: CookieService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard) // validation email, password
  @Post('login')
  async login(
    @Req() req: Request & { user: Omit<IUser, 'password'> },
    @Res() res: Response,
    @Body() payload: LoginAuthDto, // using swagger
    @Headers('user-agent') userAgent: string,
    @Headers('x-forwarded-for') ip: string,
  ) {
    //
    const { user, tokens } = await this.authService.login(
      req.user, // LocalAuthGuard
      userAgent,
      ip || req.ip || '',
    );

    // Set cookie
    this.cookieService.setCookie({
      name: `${CONSTANT_TOKEN.TOKEN}`,
      value: tokens.accessToken,
      maxAge: '3d',
      res,
    });
    this.cookieService.setCookie({
      name: `${CONSTANT_TOKEN.TOKEN_RF}`,
      value: tokens.refreshToken,
      maxAge: '7d',
      res,
    });

    res.status(HttpStatus.OK).send(
      new ResponseSuccess('Success', {
        user,
        tokens,
      }),
    );
  }

  @Public()
  @Post('register')
  async register(@Body() payload: RegisterAuthDto) {
    const newUser = await this.authService.register(payload);
    return new ResponseSuccess('Success', newUser);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const accessToken = req.cookies[`${CONSTANT_TOKEN.TOKEN}`];
    const refreshToken = req.cookies[`${CONSTANT_TOKEN.TOKEN_RF}`];
    if (!refreshToken) {
      throw new NotFoundException('Refresh token not found');
    }
    await this.authService.logout(accessToken, refreshToken);

    // Clear cookie
    this.cookieService.clearCookie({
      name: `${CONSTANT_TOKEN.TOKEN}`,
      res,
    });
    this.cookieService.clearCookie({
      name: `${CONSTANT_TOKEN.TOKEN_RF}`,
      res,
    });

    res.status(HttpStatus.OK).send(new ResponseSuccess('Success', true));
  }
}
