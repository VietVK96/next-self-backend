import { Module } from '@nestjs/common';
import configuration from './common/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { redisStore } from 'cache-manager-redis-store';
// import { redisStore } from 'cache-manager-redis-yet';
import { ContactModule } from './contact/contact.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { EntityModule } from './entities';
import { IRedisConfig } from './common/config/redis.config';
import { StickyNoteModule } from './stickyNote/stickyNote.module';
import { WaitingRoomModule } from './waitingRoom/waitingRoom.module';
import { AntecedentPrestationModule } from './antecedent-prestation/antecedent-prestation.module';
import { PatientModule } from './patients/patient.module';
import { MedicalDevicesModule } from './medialDevices/medicalDevices.module';
import { UserModule } from './user/userModule';
import { AddressModule } from './address/address.module';
import { PlanModule } from './plans/plan.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
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
    CacheModule.registerAsync<any>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (c: ConfigService) => {
        const cacheConfig = c.get<IRedisConfig>('redis');
        const storeConfig = {
          socket: {
            host: cacheConfig.host,
            port: cacheConfig.port,
          },
          database: cacheConfig.db,
          username: cacheConfig.username,
          password: cacheConfig.password,
        };
        const store = await redisStore(storeConfig);
        return {
          store,
        };
      },
      isGlobal: true,
    }),
    EntityModule,
    ContactModule,
    AuthModule,
    StickyNoteModule,
    WaitingRoomModule,
    AntecedentPrestationModule,
    PatientModule,
    MedicalDevicesModule,
    UserModule,
    AddressModule,
    PlanModule,
    MailModule,
  ],
})
export class AppModule {}
