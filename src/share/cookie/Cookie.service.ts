import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { CONSTANT_ENV } from 'src/constants/env.contant';

@Injectable()
export class CookieService {
  setCookie({ name, value, res, maxAge }: { name: string; value: string; res: Response; maxAge: '1d' | '3d' | '7d' }) {
    const msMaxAge = {
      '1d': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      // ...
    }[maxAge];

    return res.cookie(name, value, {
      httpOnly: true, // XSS (Cross-Site Scripting)
      secure: process.env.NODE_ENV === CONSTANT_ENV.PROD, // HTTPS
      maxAge: msMaxAge,
      sameSite: 'lax', // GET
    });
  }

  clearCookie({ name, res }: { name: string; res: Response }) {
    return res.clearCookie(name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === CONSTANT_ENV.PROD,
      sameSite: 'lax',
    });
  }
}
