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
import { SavePatienttModule } from './save-patient/patient.module';
import { StickyNoteModule } from './sticky-note/sticky-note.module';
import { WaitingRoomModule } from './waiting-room/waiting-room.module';
import { AntecedentPrestationModule } from './antecedent-prestation/antecedent-prestation.module';
import { PatientModule } from './patient/patient.module';
import { PrestationModule } from './prestation/prestation.module';
import { MedicalDevicesModule } from './medial-device/medical-device.module';
import { EventModule } from './event/event.module';
import { MemoModule } from './memo/memo.module';
import { AddressModule } from './address/address.module';
import { PlanModule } from './plan/plan.module';
import { MailModule } from './mail/mail.module';
import { LibrariesModule } from './libraries/libraries.module';
import { EventTaskModule } from './event-task/event-task.module';
import { FusionPatientModule } from './fusion-patient/fusion-patient.module';
import { UploadModule } from './upload/upload.module';
import { TimeslotsModule } from './timeslots/timeslots.module';
import { UserModule } from './user/user.module';
import { FileModule } from './file/file.module';
import { NgapKeysModule } from './ngap-keys/ngap-keys.module';
import { DentalModule } from './dental/dental.module';

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
        const storeConfig: any = {
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
    SavePatienttModule,
    StickyNoteModule,
    WaitingRoomModule,
    AntecedentPrestationModule,
    PatientModule,
    MedicalDevicesModule,
    EventModule,
    PrestationModule,
    EventModule,
    MemoModule,
    UserModule,
    AddressModule,
    PlanModule,
    MailModule,
    LibrariesModule,
    EventTaskModule,
    UploadModule,
    FusionPatientModule,
    FileModule,
    NgapKeysModule,
    TimeslotsModule,

    DentalModule,
  ],
})
export class AppModule {}
