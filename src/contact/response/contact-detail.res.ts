import { ApiProperty } from '@nestjs/swagger';

export class PhoneContactRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  nbr?: string;

  @ApiProperty()
  phoneTypeId?: number;

  @ApiProperty()
  phoneTypeName?: string;
}

export class MemberContactRes {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  nbr?: string;
  @ApiProperty()
  lastname?: string;
  @ApiProperty()
  firstname?: string;
  @ApiProperty()
  color?: number;
  @ApiProperty()
  amountDue?: number;
  @ApiProperty()
  amountDueProsthesis?: number;
  @ApiProperty()
  lastPayment?: string;
  @ApiProperty()
  lastCare?: string;
}

export class ContactAmoRes {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  patient_id?: number;
  @ApiProperty()
  amo_id?: number;
  @ApiProperty()
  start_date?: string;
  @ApiProperty()
  end_dat?: string;
  @ApiProperty()
  is_tp?: number;
  @ApiProperty()
  is_ald?: number;
  @ApiProperty()
  maternity_date?: string;
  @ApiProperty()
  childbirth_date?: string;
  @ApiProperty()
  code_nature_assurance?: string;
  @ApiProperty()
  code_exoneration?: string;
  @ApiProperty()
  lecture_adr?: string;
}

export class ContactAcmRes {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  patient_id?: number;
  @ApiProperty()
  amc_id?: number;
  @ApiProperty()
  start_date?: string;
  @ApiProperty()
  end_dat?: string;
  @ApiProperty()
  is_tp?: number;
  @ApiProperty()
  is_cmu?: number;
  @ApiProperty()
  is_dre_possible?: string;
  @ApiProperty()
  type_ame?: string;
  @ApiProperty()
  lecture_adr?: string;
}

export class MedicalRes {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  is_active_acs?: boolean;
  @ApiProperty()
  policy_holder?: string;
  @ApiProperty()
  tariff_type?: string;
  @ApiProperty()
  service_amo_code?: string;
  @ApiProperty()
  service_amo_start_date?: string;
  @ApiProperty()
  service_amo_end_date?: string;
}

export class ContactDetailRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  nbr?: number;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  profession?: string;

  @ApiProperty()
  birthday?: string;

  @ApiProperty()
  birthOrder?: number;

  @ApiProperty()
  quality?: number;

  @ApiProperty()
  breastfeeding?: number;

  @ApiProperty()
  pregnancy?: number;

  @ApiProperty()
  clearanceCreatinine?: number;

  @ApiProperty()
  hepaticInsufficiency?: string;

  @ApiProperty()
  weight?: number;

  @ApiProperty()
  size?: number;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  odontogram_observation?: string;

  @ApiProperty()
  notificationMsg?: string;

  @ApiProperty()
  notificationEnable?: number;

  @ApiProperty()
  notificationEveryTime?: number;

  @ApiProperty()
  reminderVisitType?: string;

  @ApiProperty()
  reminderVisitDuration?: number;

  @ApiProperty()
  reminderVisitDate?: string;

  @ApiProperty()
  reminderVisitLastDate?: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  colorMedical?: number;

  @ApiProperty()
  insee?: string;

  @ApiProperty()
  inseeKey?: string;

  @ApiProperty()
  social_security_reimbursement_rate?: number;

  @ApiProperty()
  mutualRepaymentType?: number;

  @ApiProperty()
  mutualRepaymentRate?: number;

  @ApiProperty()
  mutualComplement?: number;

  @ApiProperty()
  mutualCeiling?: number;

  @ApiProperty()
  agenesie?: number;

  @ApiProperty()
  maladieRare?: number;

  @ApiProperty()
  rxSidexisLoaded?: number;

  @ApiProperty()
  contactFamilyId?: number;

  @ApiProperty()
  external_reference_id?: number;

  @ApiProperty()
  genderId?: number;

  @ApiProperty()
  genderName?: string;

  @ApiProperty()
  genderType?: string;

  @ApiProperty()
  addressId?: number;

  @ApiProperty()
  addressStreet?: string;

  @ApiProperty()
  addressStreetComp?: string;

  @ApiProperty()
  addressZipCode?: string;

  @ApiProperty()
  addressCity?: string;

  @ApiProperty()
  addressCountry?: string;

  @ApiProperty()
  addressCountryAbbr?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerAbbr?: string;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  avatarId?: number;

  @ApiProperty()
  avatarToken?: string;

  @ApiProperty()
  avatarUrl?: string;

  @ApiProperty()
  amountDue?: number;

  @ApiProperty()
  amountDueCare?: number;

  @ApiProperty()
  amountDueProsthesis?: number;

  @ApiProperty()
  third_party_balance?: number;

  @ApiProperty()
  lastPayment?: string;

  @ApiProperty()
  lastCare?: string;

  @ApiProperty()
  addressed_by?: string;

  @ApiProperty()
  doctor?: string;

  @ApiProperty()
  phones?: PhoneContactRes[];

  @ApiProperty()
  members?: MemberContactRes[];

  @ApiProperty()
  qualityName?: string;

  @ApiProperty()
  document_counte?: number;

  @ApiProperty()
  image_counte?: number;

  @ApiProperty()
  medical?: MedicalRes;

  @ApiProperty()
  amos?: ContactAmoRes[];

  @ApiProperty()
  amcs?: ContactAcmRes[];

  @ApiProperty()
  image_library_link?: string;
}