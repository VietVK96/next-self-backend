import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './services/jobs.service';
import { TexterService } from 'src/notifier/services/texter.service';
import { ReminderService } from './services/reminder.service';
import { UserEntity } from 'src/entities/user.entity';
import { UserService } from 'src/user/services/user.service';
import { SendingLogEntity } from 'src/entities/sending-log.entity';
import { UserSmsEntity } from 'src/entities/user-sms.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { AddressService } from 'src/address/service/address.service';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SendingLogEntity,
      UserSmsEntity,
      UserMedicalEntity,
      MailModule,
    ]),
  ],
  providers: [
    JobsService,
    TexterService,
    ReminderService,
    UserService,
    AddressService,
    MailTransportService,
  ],
  controllers: [],
})
export class JobsModule {}
