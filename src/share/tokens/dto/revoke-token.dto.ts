import { IToken } from 'src/interfaces/model/token.model';

export class RevokeTokenDto implements Partial<IToken> {
  token: string;
  refreshToken: string;
}
