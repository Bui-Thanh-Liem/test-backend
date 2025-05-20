import { IBase } from './base.model';

export interface ICategory extends IBase {
  name: string;
  description: string;
  slug: string;
  parent: ICategory | string | null;
  children: ICategory[] | string[];
}
