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
import { QuotationMutualController } from './quotation-mutual.controller';
import { DevisStd2Controller } from './devisStd2.controller';
import { FactureController } from './facture.controller';
import { OrdonnancesController } from './ordonnances.controller';
import { QuotesController } from './quotes.controller';
import { ContactPaymentService } from 'src/contact/services/contact.payment.service';
import { QuotationController } from './quotation.controller';
import { DocumentMailService } from 'src/mail/services/document.mail.service';
import { PreviewMailService } from 'src/mail/services/preview.mail.service';
import { TemplateMailService } from 'src/mail/services/template.mail.service';
import { PdfMailService } from 'src/mail/services/pdf.mail.service';
import { DataMailService } from 'src/mail/services/data.mail.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(listEntities),
    PaymentSchedulesModule,
    MailModule,
  ],
  controllers: [
    DevisHNController,
    DevisStd2Controller,
    FactureController,
    OrdonnancesController,
    QuotationMutualController,
    QuotationController,
    QuotesController,
  ],
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
    QuotesServices,
    TherapeuticAlternativeService,
    UserService,
    QuotationServices,
    ContactPaymentService,
    DocumentMailService,
    DataMailService,
    PdfMailService,
    TemplateMailService,
    PreviewMailService,
  ],
})
export class DentalModule {}
