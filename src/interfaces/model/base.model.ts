import { IUser } from './user.model';

export interface IBase {
  id: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: IUser;
  updatedBy: IUser;
}
