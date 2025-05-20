import { HttpExceptionFilter } from 'src/exceptions/http.exception';
import { TypeOrmExceptionFilter } from 'src/exceptions/typeOrm.exception';
import { IBase } from 'src/interfaces/model/base.model';

export function isExitItem<T extends IBase>(value: any): value is T {
  return value !== null && typeof value === 'object' && typeof value.id === 'string';
}

// export function isErrorInstance(
//   error: any,
// ): error is HttpExceptionFilter | TypeOrmExceptionFilter {
//   return (
//     error instanceof HttpExceptionFilter ||
//     error instanceof TypeOrmExceptionFilter
//   );
// }
