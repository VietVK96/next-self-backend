import './env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { errFormat, filterError } from './common/util/filter-error';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors({
    origin: function (_origin, callback) {
      callback(null, true);
    },
  });
  const configService = app.get(ConfigService);
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

// Test something
