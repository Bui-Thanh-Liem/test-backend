import { HttpStatus } from '@nestjs/common';
import { IStackTrace } from 'src/interfaces/common';

export abstract class AResponseBase<T> {
  statusCode: HttpStatus;
  message: string;
  data: T;

  constructor(statusCode: HttpStatus, message: string, data: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export abstract class AResponseError {
  path: string;
  message: string;
  method: string;
  statusCode: HttpStatus;
  timestamp: string;
  stack?: IStackTrace;

  constructor(
    path: string,
    method: string,
    message: string,
    statusCode: HttpStatus,
    timestamp: string,
    stack?: IStackTrace,
  ) {
    this.path = path;
    this.method = method;
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = timestamp;
    if (stack) this.stack = stack;
  }
}
