import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseError } from 'src/classes';
import { CONSTANT_ENV } from 'src/constants/env.config';
import { IStackTrace } from 'src/interfaces/common';
import { QueryFailedError, TypeORMError } from 'typeorm';

@Catch(TypeORMError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    //
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal Server Error';

    //
    if (exception instanceof QueryFailedError) {
      statusCode = 400;
      if (exception.message.includes('Duplicate entry')) {
        message = 'Duplicate entry detected. The resource already exists.';

        //
        const detail = (exception as any).detail || exception.message;
        message = `${detail}`;
      } else {
        message = `Database query failed: ${exception.message}`;
      }
    } else if (exception instanceof TypeORMError) {
      // Other
      statusCode = 500;
      message = `Database error: ${exception.message}`;
    }

    const stack: IStackTrace | undefined =
      process.env.NODE_ENV === CONSTANT_ENV.DEV &&
      exception instanceof TypeORMError
        ? {
            stack: exception.stack,
            method: request.method,
            headers: request.headers,
            query: request.query,
            body: request.body,
          }
        : undefined;

    //
    const responseError: ResponseError = {
      statusCode: statusCode,
      method: request.method,
      message: message,
      path: request.url,
      timestamp: new Date().toISOString(),
      stack: stack,
    };

    this.logger.debug(responseError);

    response.status(statusCode).json(responseError);
  }
}
