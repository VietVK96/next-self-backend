import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { UploadEntity } from './upload.entity';
import { TagEntity } from './tag.entity';
import { LibraryBankEntity } from './library-bank.entity';
import { CashingEntity } from './cashing.entity';
import { NgapKeyEntity } from './ngapKey.entity';
import { LibraryActFamilyEntity } from './library-act-family.entity';
import { LibraryActEntity } from './library-act.entity';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';
import { ReminderUnitEntity } from './reminder-unit.entity';
import { AmcEntity } from './amc.entity';
import { AmoEntity } from './amo.entity';
import { AntecedentPrestationEntity } from './antecedentprestation.entity';
import { AppointmentReminderLibraryEntity } from './appointment-reminder-library.entity';
import { BankCheckEntity } from './bank-check.entity';
import { BillEntity } from './bill.entity';
import { BillLineEntity } from './bill-line.entity';
import { CaresheetStatusEntity } from './caresheet-status.entity';
import { CaresheetRejectionEntity } from './caresheet-rejection.entity';
import { CashingContactEntity } from './cashing-contact.entity';
import { CcamCmuCodificationEntity } from './ccam-cmu-codification.entity';
import { CcamEntity } from './ccam.entity';
import { CcamConditionEntity } from './ccamcondition.entity';
import { CcamFamilyEntity } from './ccamFamily.entity';
import { CcamMenuEntity } from './ccamMenu.entity';
import { CcamPanierEntity } from './ccamPanier.entity';
import { CcamToothEntity } from './ccamTooth.entity';
import { CcamUnitPriceEntity } from './ccamunitprice.entity';
import { CmcicPaymentEntity } from './cmcic-payment.entity';
import { ContactDocumentEntity } from './contact-document.entity';
import { ContactFamilyEntity } from './contact-family.entity';
import { ContactNoteEntity } from './contact-note.entity';
import { ContactEntity } from './contact.entity';
import { ContactUserEntity } from './contact-user.entity';
import { ConversationEntity } from './conversation.entity';
import { ConversationMemberEntity } from './conversation-member.entity';
import { ConversationMessageEntity } from './conversation-message.entity';
import { ContraindicationEntity } from './contraindication.entity';
import { CorrespondentTypeEntity } from './correspondent-type.entity';
import { CorrespondentEntity } from './correspondent.entity';
import { DentalMaterialEntity } from './dental-material.entity';
import { DentalEventTaskEntity } from './dental-event-task.entity';
import { DentalModifierEntity } from './dental-modifier.entity';
import { DentalQuotationActEntity } from './dental-quotation-act.entity';
import { DentalQuotationEntity } from './dental-quotation.entity';
import { DomtomMajorationEntity } from './domtom-majoration.entity';
import { DomtomEntity } from './domtom.entities';
import { EmailAccountEntity } from './email-account.entity';
import { EmailOutgoingServerEntity } from './email-outgoing-server.entity';
import { EventHistoricalEntity } from './event-historical.entity';
import { EventOccurrenceEntity } from './event-occurrence.entity';
import { EventEntity } from './event.entity';
import { EventTaskEntity } from './event-task.entity';
import { EventTypeEntity } from './event-type.entity';
import { FseEntity } from './fse.entity';
import { GenderEntity } from './gender.entity';
import { GlossaryEntity } from './glossary.entity';
import { GlossaryEntryEntity } from './glossary-entry.entity';
import { ImagingSoftwareEntity } from './imaging-software.entity';
import { LettersEntity } from './letters.entity';
import { LibraryActAssociationEntity } from './library-act-association.entity';
import { LibraryActComplementaryEntity } from './library-act-complementary.entity';
import { LibraryActQuantityTariffEntity } from './library-act-quantity-tariff.entity';
import { LibraryCityEntity } from './library-city.entity';
import { LibraryOdontogramEntity } from './library-odontogram.entity';
import { LicenseEntity } from './license.entity';
import { LotEntity } from './lot.entity';
import { LotStatusEntity } from './lot-status.entity';
import { MedicalDeviceEntity } from './medical-device.entity';
import { MedicalHeaderEntity } from './medical-header.entity';
import { MedicalOrderEntity } from './medical-order.entity';
import { MedicamentEntity } from './medicament.entity';
import { MedicamentFamilyEntity } from './medicament-family.entity';
import { MemoEntity } from './memo.entity';
import { MobileAuthenticationCodeEntity } from './mobile-authentication-code.entity';
import { MobileSettingEntity } from './mobile-setting.entity';
import { MobileSubscriptionEntity } from './mobile-subscription.entity';
import { NoemieEntity } from './noemie.entity';
import { OrganizationSubscriptionEntity } from './organization-subcription.entity';
import { PatientAmcEntity } from './patient-amc.entity';
import { PatientAmoEntity } from './patient-amo.entity';
import { PatientMedicalEntity } from './patient-medical.entity';
import { PaymentPlanDeadlineEntity } from './payment-plan-deadline.entity';
import { PaymentPlanEntity } from './payment-plan.entity';
import { PaypalPaymentEntity } from './paypal-payment.entity';
import { PeriodontalChartEntity } from './periodontal-chart.entity';
import { PhoneEntity } from './phone.entity';
import { PhoneTypeEntity } from './phone-type.entity';
import { PlanEntity } from './plan.entity';
import { PlanEventEntity } from './plan-event.entity';
import { PlanPlfEntity } from './plan-plf.entity';
import { PolicyHolderEntity } from './policy-holder.entity';
import { PrescriptionTemplateEntity } from './prescription-template.entity';
import { PrivilegeEntity } from './privilege.entity';
import { PushNotificationDeviceTokenEntity } from './push-notification-device-token.entity';
import { PushNotificationEntity } from './push-notification.entity';
import { RecurringPatternEntity } from './recurring-pattern.entity';
import { ReminderEntity } from './reminder.entity';
import { ReminderReceiverEntity } from './reminder-receiver.entity';
import { ReminderTypeEntity } from './reminder-type.entity';
import { ResourceEntity } from './resource.entity';
import { SearchEntity } from './search.entity';
import { SendingLogEntity } from './sending-log.entity';
import { SlipCheckEntity } from './slip-check.entity';
import { SpecialtyCodeEntity } from './specialty-code.entity';
import { StatisticXrayGatewayEntity } from './statistic-xray-gateway.entity';
import { StickyNoteEntity } from './sticky-note.entity';
import { StorageSpaceEntity } from './storage-space.entity';
import { StorageSpacePackEntity } from './storage-space-pack.entity';
import { SyncWzagendaEventEntity } from './sync-wzagenda-event.entity';
import { SyncWzagendaUserEntity } from './sync-wzagenda-user.entity';
import { TariffTypeEntity } from './tariff-type.entity';
import { TeletransmissionEntity } from './teletransmission.entity';
import { ThirdPartyAmcEntity } from './third-party-amc.entity';
import { ThirdPartyAmoEntity } from './third-party-amo.entity';
import { TimeslotEntity } from './timeslot.entity';
import { TraceabilityEntity } from './traceability.entity';
import { UserAmoEntity } from './user-amo.entity';
import { UserConnectionEntity } from './user-connection.entity';
import { UserMedicalEntity } from './user-medical.entity';
import { UserPreferenceEntity } from './user-preference.entity';
import { UserPreferenceQuotationEntity } from './user-preference-quotation.entity';
import { UserResourceEntity } from './user-resource.entity';
import { UserSmsEntity } from './user-sms.entity';
import { UserTypeEntity } from './user-type.entity';
import { WorkstationEntity } from './workstation.entity';
import { WzagendaContactEntity } from './wzagenda-contact.entity';
import { ContactPhoneCopEntity } from './contact-phone-cop.entity';
import { FileTagEntity } from './file-tag.entity';
import { LotCareSheetEntity } from './lot-caresheet.entity';
import { CorrespondentPhoneCppEntity } from './correspondent-phone-cpp.entity';
import { NoemioCaresheetEntity } from './noemie-caresheet.entity';
import { LibraryActAttachmentPivotEntity } from './library-act-attachment-pivot.entity';
import { LibraryActOdontogramPivotEntity } from './library-act-odontogram-pivot.entity';

export const listEntities = [
  UserEntity,
  OrganizationEntity,
  AddressEntity,
  UploadEntity,
  TagEntity,
  LibraryBankEntity,
  CashingEntity,
  NgapKeyEntity,
  LibraryActFamilyEntity,
  LibraryActEntity,
  LibraryActQuantityEntity,
  ReminderUnitEntity,
  AmcEntity,
  AmoEntity,
  AntecedentPrestationEntity,
  AppointmentReminderLibraryEntity,
  BankCheckEntity,
  BillEntity,
  BillLineEntity,
  CaresheetStatusEntity,
  CaresheetRejectionEntity,
  CashingContactEntity,
  CcamCmuCodificationEntity,
  CcamEntity,
  CcamConditionEntity,
  CcamFamilyEntity,
  CcamMenuEntity,
  CcamPanierEntity,
  CcamToothEntity,
  CcamUnitPriceEntity,
  CmcicPaymentEntity,
  ContactDocumentEntity,
  ContactFamilyEntity,
  ContactNoteEntity,
  ContactEntity,
  ContactUserEntity,
  ConversationEntity,
  ConversationMemberEntity,
  ConversationMessageEntity,
  ContraindicationEntity,
  CorrespondentTypeEntity,
  CorrespondentEntity,
  DentalMaterialEntity,
  DentalEventTaskEntity,
  DentalModifierEntity,
  DentalQuotationActEntity,
  DentalQuotationEntity,
  DomtomMajorationEntity,
  DomtomEntity,
  EmailAccountEntity,
  EmailOutgoingServerEntity,
  EventHistoricalEntity,
  EventOccurrenceEntity,
  EventEntity,
  EventTaskEntity,
  EventTypeEntity,
  FseEntity,
  GenderEntity,
  GlossaryEntity,
  GlossaryEntryEntity,
  ImagingSoftwareEntity,
  LettersEntity,
  LibraryActAssociationEntity,
  LibraryActComplementaryEntity,
  LibraryActQuantityTariffEntity,
  LibraryCityEntity,
  LibraryOdontogramEntity,
  LicenseEntity,
  LotEntity,
  LotStatusEntity,
  MedicalDeviceEntity,
  MedicalHeaderEntity,
  MedicalOrderEntity,
  MedicamentEntity,
  MedicamentFamilyEntity,
  MemoEntity,
  MobileAuthenticationCodeEntity,
  MobileSettingEntity,
  MobileSubscriptionEntity,
  NoemieEntity,
  OrganizationSubscriptionEntity,
  PatientAmcEntity,
  PatientAmoEntity,
  PatientMedicalEntity,
  PaymentPlanDeadlineEntity,
  PaymentPlanEntity,
  PaypalPaymentEntity,
  PeriodontalChartEntity,
  PhoneEntity,
  PhoneTypeEntity,
  PlanEntity,
  PlanEventEntity,
  PlanPlfEntity,
  PolicyHolderEntity,
  PrescriptionTemplateEntity,
  PrivilegeEntity,
  PushNotificationDeviceTokenEntity,
  PushNotificationEntity,
  RecurringPatternEntity,
  ReminderEntity,
  ReminderReceiverEntity,
  ReminderTypeEntity,
  ResourceEntity,
  SearchEntity,
  SendingLogEntity,
  SlipCheckEntity,
  SpecialtyCodeEntity,
  StatisticXrayGatewayEntity,
  StickyNoteEntity,
  StorageSpaceEntity,
  StorageSpacePackEntity,
  SyncWzagendaEventEntity,
  SyncWzagendaUserEntity,
  TariffTypeEntity,
  TeletransmissionEntity,
  ThirdPartyAmcEntity,
  ThirdPartyAmoEntity,
  TimeslotEntity,
  TraceabilityEntity,
  UserAmoEntity,
  UserConnectionEntity,
  UserMedicalEntity,
  UserPreferenceEntity,
  UserPreferenceQuotationEntity,
  UserResourceEntity,
  UserSmsEntity,
  UserTypeEntity,
  WorkstationEntity,
  WzagendaContactEntity,
  ContactPhoneCopEntity,
  FileTagEntity,
  LotCareSheetEntity,
  CorrespondentPhoneCppEntity,
  NoemioCaresheetEntity,
  LibraryActAttachmentPivotEntity,
  LibraryActOdontogramPivotEntity,
];
@Module({
  imports: [TypeOrmModule.forFeature(listEntities)],
  controllers: [],
  providers: [],
})
export class EntityModule {}
