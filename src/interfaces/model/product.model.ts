import { IBase } from './base.model';
import { ICategory } from './category.model';

export interface IProduct extends IBase {
  name: string;
  price: number;
  category: ICategory | string;
  subCategory: ICategory[] | string[];
}
