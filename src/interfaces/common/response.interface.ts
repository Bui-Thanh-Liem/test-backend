import { IUser } from '../model/user.model';

export interface IResponseLogin {
  user: Omit<IUser, 'password'>;
  tokens: IResponseToken;
}

export interface IResponseToken {
  accessToken: string;
  refreshToken: string;
}

export interface IResponseFindAll<T> {
  items: T[];
  totalItems: number;
}
