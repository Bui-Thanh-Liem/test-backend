import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IResponseLogin } from 'src/interfaces/common/response.interface';
import { IUser } from 'src/interfaces/model/user.model';
import { TokensService } from 'src/share/tokens/tokens.service';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private tokenService: TokensService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    //
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    //
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const { password: passwordInDatabase, ...result } = user;

    return result;
  }

  async login(userLogged: Omit<IUser, 'password'>, deviceInfo: string, ipAddress: string): Promise<IResponseLogin> {
    //
    const { accessToken, refreshToken } = await this.tokenService.sign({
      user: userLogged,
      deviceInfo,
      ipAddress,
    });

    //
    return {
      user: userLogged,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async register(payload: RegisterAuthDto): Promise<UserEntity> {
    return await this.userService.create(payload);
  }

  async logout(token: string, refreshToken: string) {
    try {
      this.tokenService.verifyRefreshToken(refreshToken);
      const revoked = await this.tokenService.revoke({ refreshToken, token }); // revoke not delete to check history login
      if (!revoked) {
        throw new BadRequestException('Revoke token fail');
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
