import { IBase } from './base.model';
import { IUser } from './user.model';

export interface IToken extends IBase {
  token: string;
  refreshToken?: string | null;
  user: Omit<IUser, 'password'> | string;
  isRevoked: boolean;
  expiresAt: Date;
  refreshTokenExpiresAt?: Date | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  isExpired(): boolean;
  isRefreshTokenExpired(): boolean;
}
