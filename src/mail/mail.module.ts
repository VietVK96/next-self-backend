import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettersEntity } from 'src/entities/letters.entity';
import { MailController } from './mail.controller';
import { MailService } from './services/mail.service';
import { PatientService } from 'src/patient/service/patient.service';
import { ContactEntity } from 'src/entities/contact.entity';
import { ContactService } from 'src/contact/services/contact.service';
import { PermissionService } from 'src/user/services/permission.service';
import { AddressService } from 'src/address/service/address.service';
import { UserEntity } from 'src/entities/user.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LettersEntity,
      ContactEntity,
      UserEntity,
      ContactUserEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      AmoEntity,
      AmcEntity,
    ]),
  ],
  controllers: [MailController],
  providers: [
    MailService,
    PatientService,
    ContactService,
    PermissionService,
    AddressService,
    PaymentScheduleService,
  ],
  exports: [MailService],
})
export class MailModule {}
