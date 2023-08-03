import { SettingsModule } from './settings/settings.module';
import { Module, RequestMethod } from '@nestjs/common';
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
import { PlanPlfModule } from './plan-plf/plan-plf.module';
import { FileModule } from './file/file.module';
import { NgapKeysModule } from './ngap-keys/ngap-keys.module';
import { InterfacageModule } from './interfacage/interfacage.module';
import { BcbModule } from './bcb/bcb.module';
import { DentalModule } from './dental/dental.module';
import { TagModule } from './tag/tag.module';
import { ContraindicationsModule } from './contraindications/contraindications.module';
import { GlossariesModule } from './glossaries/glossaries.module';
import { OrganizationModule } from './organization/organization.module';
import { TrashContactModule } from './trash/contact/trash.contact.module';
import { TrashEventModule } from './trash/event/trash.event.module';
import { CorrespondentModule } from './correspondent/correspondent.module';
import { MedicalModule } from './medical/medical.module';
import { CaresheetsModule } from './caresheets/caresheets.module';
import { PaymentSchedulesModule } from './payment-schedule/payment-schedule.module';
import { BankModule } from './bank/bank.module';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { SecuritiesModule } from './securities/securities.module';
import { LoggerModule } from 'nestjs-pino';
import { TeletranmistionModule } from './teletranmistion/teletranmistion.module';
import { RecipeModule } from './recipe/recipe.module';
import { StatisticsModule } from './statistics/statistics.module';
import { EventTypeModule } from './event-type/event-type.module';
import { CcamModule } from './ccam/ccam.module';
import { PaymentModule } from './payment/payment.module';
import { PrescriptionTemplateModule } from './prescription-template/prescription-template.module';
import { MedicamentModule } from './medicament/medicament.module';
import { ImportModule } from './import/import.module';
import { MedicamentFamilyModule } from './medicament-family/medicament-family.module';
import { PeriodontalChartsModule } from './periodontal-charts/periodontal-charts.module';
import { ResourceModule } from './resource/resource.module';
import { ConversationsModule } from './conversations/conversations.module';

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
  MailerModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: async (config: ConfigService) => ({
      transport: {
        host: config.get('EMAIL_HOST'),
        secure: false,
        auth: {
          pass: config.get('EMAIL_PASSWORD'),
          user: config.get('EMAIL_USER'),
          port: config.get('EMAIL_PORT'),
        },
      },
      defaults: {
        from: config.get('EMAIL_FROM_USER'),
      },
      template: {
        dir: join(process.cwd(), 'templates/'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    inject: [ConfigService],
  }),
  EntityModule,
  ContactModule,
  AuthModule,
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
  TagModule,
  ContraindicationsModule,
  OrganizationModule,
  PlanPlfModule,
  BcbModule,
  DentalModule,
  ContraindicationsModule,
  TrashContactModule,
  TrashEventModule,
  CorrespondentModule,
  TagModule,
  GlossariesModule,
  MedicalModule,
  InterfacageModule,
  CaresheetsModule,
  BankModule,
  PaymentSchedulesModule,
  SecuritiesModule,
  SettingsModule,
  TeletranmistionModule,
  RecipeModule,
  StatisticsModule,
  EventTypeModule,
  CcamModule,
  PaymentModule,
  PrescriptionTemplateModule,
  MedicamentModule,
  ImportModule,
  MedicamentFamilyModule,
  PeriodontalChartsModule,
  ResourceModule,
  ConversationsModule,
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
