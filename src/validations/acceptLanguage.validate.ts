import { UnprocessableEntityException } from '@nestjs/common';
import { TTranslations } from 'src/types/translations.type';

export function accessLanguage(key: TTranslations) {
  if (!['vi', 'en'].includes(key)) {
    throw new UnprocessableEntityException(`Key must be either "vi" or "en"`);
  }
}
