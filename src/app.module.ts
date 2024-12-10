import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import configuration from './common/config';
import { EntityModule } from './entities';

const importsModules = [
  ConfigModule.forRoot({
    load: configuration,
    isGlobal: true,
  }),
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (c: ConfigService) => {
      const configDatabase = c.get<TypeOrmModuleOptions>('database');
      return configDatabase;
    },
  }),
  EntityModule,
  AuthModule,
];

if (process.env.LOGSTACK_ENABLE === 'true') {
  importsModules.push(
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'trace' : 'info',
      },
      exclude: [
        {
          method: RequestMethod.ALL,
          path: '/auth/refresh',
        },
        {
          method: RequestMethod.ALL,
          path: '/auth/login',
        },
        {
          method: RequestMethod.ALL,
          path: '/user/create-token-download',
        },
      ],
    }),
  );
}
@Module({
  imports: importsModules,
})
export class AppModule {}
