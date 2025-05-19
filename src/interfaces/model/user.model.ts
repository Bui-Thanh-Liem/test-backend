import { IBase } from './base.model';
import { IToken } from './token.model';

export interface IUser extends IBase {
  fullName: string;
  email: string;
  password: string;
  tokens: IToken[] | string[];
  isAdmin: boolean;
}
