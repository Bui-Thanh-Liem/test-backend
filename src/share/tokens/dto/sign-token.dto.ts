import { IUser } from 'src/interfaces/model/user.model';

export class SignTokenDto {
  user: Omit<IUser, 'password'>;
  deviceInfo: string;
  ipAddress: string;
}
