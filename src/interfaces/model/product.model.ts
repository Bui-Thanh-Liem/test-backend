import { IBase } from './base.model';
import { ICategory } from './category.model';
import { IUser } from './user.model';

export interface IProduct extends IBase {
  name: string;
  price: number;
  category: ICategory | string | null;
  subCategory: ICategory | string | null;
  likes: IUser[] | string[];
  likesCount?: number;
}
