import { IBase } from 'src/interfaces/model/base.model';

export function isExitItem<T extends IBase>(value: any): value is T {
  return value !== null && typeof value === 'object' && typeof value.id === 'string';
}
