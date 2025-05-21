import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('/api/v1');

  //
  app.use(compression());

  //
  app.use(helmet());

  //
  app.use(cookieParser());

  //
  app.enableCors({
    origin: [`${process.env.CLIENT_HOST}`],
    methods: ['HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  //
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Using class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationError) => {
        const err = validationError?.map((validateError) => ({
          field: validateError.property,
          error: validateError.constraints, // message errors
        }));
        throw new UnprocessableEntityException(err);
      },
    }),
  );

  //
  const configSwagger = new DocumentBuilder().setTitle('TEST-BACKEND').setVersion('1.0').build();
  const documentSwagger = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, documentSwagger);

  //
  await app.listen(process.env.APP_PORT ?? 9000);

  //
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
