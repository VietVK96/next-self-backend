import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettersEntity } from 'src/entities/letters.entity';
import { MailController } from './mail.controller';
import { MailService } from './services/mail.service';
import { PatientService } from 'src/patient/service/patient.service';
import { AddressService } from 'src/address/service/address.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { ContactService } from 'src/contact/services/contact.service';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { PhoneEntity } from 'src/entities/phone.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LettersEntity,
      UserMedicalEntity,
      ContactEntity,
      UserEntity,
      ContactUserEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      AmoEntity,
      AmcEntity,
      PhoneEntity,
      CorrespondentEntity,
    ]),
  ],
  controllers: [MailController],
  providers: [
    MailService,
    PatientService,
    AddressService,
    PermissionService,
    ContactService,
    PaymentScheduleService,
  ],
  exports: [MailService],
})
export class MailModule {}
