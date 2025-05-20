import { IBase } from './base.model';

export interface ITranslations extends IBase {
  entityType: string;
  entityId: string;
  languageCode: 'vi' | 'en';
  fieldName: string;
  content: string;
}
