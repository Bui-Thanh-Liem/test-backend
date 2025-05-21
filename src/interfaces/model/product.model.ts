import { IBase } from './base.model';
import { ICategory } from './category.model';
import { IUser } from './user.model';

export interface IProduct extends IBase {
  name_vi: string;
  name_en: string;
  slug_vi: string;
  slug_en: string;
  price: number;
  stock: number;
  category: ICategory | string | null;
  subCategory: ICategory | string | null;
  likes: IUser[] | string[];
  numberLike?: number;
}
