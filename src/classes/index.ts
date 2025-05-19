import { HttpStatus } from '@nestjs/common';
import {
  AResponseBase,
  AResponseError,
} from './abstracts/ABaseResponse.abstract';

export class ResponseSuccess<T> extends AResponseBase<T> {
  constructor(message: string = 'Success', data: T) {
    super(HttpStatus.OK, message, data);
  }
}

export class ResponseError extends AResponseError {
  constructor(
    path: string,
    method: string,
    message: string,
    statusCode: HttpStatus,
  ) {
    super(path, method, message, statusCode, new Date().toISOString());
  }
}
