import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { MailService } from 'src/mail/services/mail.service';
import { PatientService } from 'src/patient/service/patient.service';
import { MailModule } from 'src/mail/mail.module';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { LettersEntity } from 'src/entities/letters.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { AddressService } from 'src/address/service/address.service';
import { ContactService } from 'src/contact/services/contact.service';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { EmailAccountEntity } from 'src/entities/email-account.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      LettersEntity,
      ContactEntity,
      ContactUserEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      AmoEntity,
      AmcEntity,
      PhoneEntity,
      CorrespondentEntity,
      EmailAccountEntity,
    ]),
    MailModule,
  ],
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    MailTransportService,
    MailService,
    PatientService,
    PaymentScheduleService,
    PermissionService,
    AddressService,
    ContactService,
  ],
})
export class FeedbackModule {}
