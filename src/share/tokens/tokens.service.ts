import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IPayloadToken } from 'src/interfaces/common';
import { IResponseToken } from 'src/interfaces/common/response.interface';
import { UserEntity } from 'src/routes/users/entities/user.entity';
import { isExitItem } from 'src/utils/isPredicates.util';
import { Repository } from 'typeorm';
import { RevokeTokenDto } from './dto/revoke-token.dto';
import { SignTokenDto } from './dto/sign-token.dto';
import { TokenEntity } from './entities/token.entity';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,

    private jwtService: JwtService,
  ) {}

  async sign(payload: SignTokenDto): Promise<IResponseToken> {
    const { user, deviceInfo, ipAddress } = payload;
    const payloadToken: IPayloadToken = { userId: user.id };

    //
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payloadToken, {
        secret: process.env.SECRET_ACCESS_KEY,
        expiresIn: '3d',
      }),
      this.jwtService.signAsync(payloadToken, {
        secret: process.env.SECRET_REFRESH_KEY,
        expiresIn: '7d',
      }),
    ]);

    //
    const dataCreate = this.tokenRepository.create({
      token: accessToken,
      refreshToken: refreshToken,
      user: user as unknown as Omit<UserEntity, 'password'>,
      deviceInfo,
      ipAddress,
      expiresAt: this.getTimeExpired(3),
      refreshTokenExpiresAt: this.getTimeExpired(7),
    });
    await this.tokenRepository.save(dataCreate);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<IResponseToken> {
    //
    const findToken = await this.tokenRepository.findOne({
      where: { refreshToken },
    });

    //
    if (!findToken || findToken.isRevoked || findToken.isRefreshTokenExpired()) {
      throw new UnauthorizedException('Login again');
    }

    //
    const payload = await this.verifyRefreshToken(refreshToken);

    //
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.SECRET_ACCESS_KEY,
        expiresIn: '3d',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.SECRET_REFRESH_KEY,
        expiresIn: '7d',
      }),
    ]);

    //
    const tokenUpdated = await this.tokenRepository.save({
      ...findToken,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: this.getTimeExpired(3),
      refreshTokenExpiresAt: this.getTimeExpired(7),
    });

    if (!tokenUpdated) {
      throw new UnauthorizedException('Login again');
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revoke({ token, refreshToken }: RevokeTokenDto) {
    if (!token && !refreshToken) return false;

    //
    const findToken = await this.tokenRepository.findOne({
      where: [{ token }, { refreshToken }],
    });

    //
    if (!isExitItem(findToken)) {
      throw new UnauthorizedException('Token not found');
    }

    //
    const revoked = await this.tokenRepository.save({
      ...findToken,
      isRevoked: true,
    });

    //
    return !!revoked.id;
  }

  async verifyAccessToken(token: string): Promise<IPayloadToken> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_ACCESS_KEY,
      });
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  async verifyRefreshToken(token: string): Promise<IPayloadToken> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_REFRESH_KEY,
      });
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  getTimeExpired(num: number) {
    return new Date(Date.now() + num * 24 * 60 * 60 * 1000);
  }
}
