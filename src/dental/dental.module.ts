import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationMutualServices } from './services/quotaion-mutual.services';
import { MailService } from 'src/mail/services/mail.service';
import { ContactService } from 'src/contact/services/contact.service';
import { PatientService } from 'src/patient/service/patient.service';
import { PermissionService } from 'src/user/services/permission.service';
import { AddressService } from 'src/address/service/address.service';
import { DevisStd2Services } from './services/devisStd2.services';
import { DevisHNController } from './devisHN.controller';
import { DentalController } from './dental.controller';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { CorrespondentService } from 'src/correspondent/services/correspondent.service';
import { OrdonnancesServices } from './services/ordonnances.services';
import { DevisHNServices } from './services/devisHNRequestAjax.service';
import { FactureServices } from './services/facture.services';
import { UserService } from 'src/user/services/user.service';
import { ConfigService } from '@nestjs/config';
import { QuotationServices } from './services/quotation.service';
import { PatientOdontogramService } from 'src/patient/service/patientOdontogram.service';
import { QuotesServices } from './services/quotes.service';
import { PaymentSchedulesModule } from 'src/payment-schedule/payment-schedule.module';
import { TherapeuticAlternativeService } from './services/therapeuticAlternative.service';
import { listEntities } from 'src/entities';
import { DevisServices } from './services/devisHN.services';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature(listEntities), PaymentSchedulesModule],
  controllers: [DentalController, DevisHNController],
  providers: [
    AddressService,
    ConfigService,
    ContactService,
    ContactNoteEntity,
    CorrespondentService,
    DevisHNServices,
    DevisServices,
    DevisStd2Services,
    FactureServices,
    MailService,
    MailTransportService,
    OrdonnancesServices,
    PatientOdontogramService,
    PatientService,
    PaymentScheduleService,
    PermissionService,
    QuotationMutualServices,
    QuotationServices,
    QuotesServices,
    TherapeuticAlternativeService,
    UserService,
  ],
})
export class DentalModule {}
