import './env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  NestApplicationOptions,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { errFormat, filterError } from './common/util/filter-error';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { LoggerErrorInterceptor } from 'nestjs-pino';
import { json, urlencoded } from 'express';

/**
 * Project convert PHP to nodejs
 * It is best for learn.
 * Some function is CRUD but 10% function working verry hard
 * Try up!!!!
 */
//Some thing
async function bootstrap() {
  const options: NestApplicationOptions = {};
  if (process.env.LOGSTACK_ENABLE === 'true') {
    options.logger = false;
  }
  const app = await NestFactory.create(AppModule, options);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors({
    origin: function (_origin, callback) {
      callback(null, true);
    },
  });
  const configService = app.get(ConfigService);
  if (process.env.LOGSTACK_ENABLE === 'true') {
    app.useGlobalInterceptors(new LoggerErrorInterceptor());
  }
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new UnprocessableEntityException(
          errFormat('ValidationError', filterError(errors)),
        );
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  if (configService.get<boolean>('app.isSwagger')) {
    const options = new DocumentBuilder()
      .setTitle('API backend user')
      .setDescription('API Server')
      .addServer(configService.get<string>('app.swaggerApi'))
      .setVersion('dev')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('swagger', app, document);
  }

  const port = configService.get<string>('app.port');
  await app.listen(port, () => {
    console.log(
      '🚀 Start at port: ',
      port,
      '. Node version: ',
      process.version,
    );
  });
}
bootstrap();
