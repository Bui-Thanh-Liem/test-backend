import { IBase } from './base.model';

export interface ICategory extends IBase {
  name?: string;
  name_vi: string;
  name_en: string;
  description_vi: string;
  description_en: string;
  slug_vi: string;
  slug_en: string;
  parent: ICategory | string | null;
  children: ICategory[] | string[];
}
