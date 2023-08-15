import { ApiProperty } from '@nestjs/swagger';
import { CaresheetRejectionEntity } from 'src/entities/caresheet-rejection.entity';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { LotEntity } from 'src/entities/lot.entity';
import { PatientAmcEntity } from 'src/entities/patient-amc.entity';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { EnumThirdPartyStatus } from 'src/entities/third-party-amc.entity';

export class PatientContactPhoneRes {
  nbr?: string;
}

export class PatientContactRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  DT_RowId?: number;

  @ApiProperty()
  amountDue?: string;

  @ApiProperty()
  birthday?: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  insee_number?: number;

  @ApiProperty()
  insee_number_key?: string;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  nbr?: number;

  @ApiProperty()
  phones?: PatientContactPhoneRes[];

  @ApiProperty()
  practitionerAbbr?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  reliability?: number;

  @ApiProperty()
  value?: number;
}

export class ThirdPartyPatientRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  full_name?: string;
}

export class AmcRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  libelle?: string;

  @ApiProperty()
  numero?: string;
}

export class ThirdPartyAmcRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  status?: string;

  @ApiProperty()
  amc?: AmcRes;
}

export class AmoRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  libelle?: string;

  @ApiProperty()
  code_national?: string;
}

export class ThirdPartyAmoRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  status?: string;

  @ApiProperty()
  amo?: AmoRes;
}

export class PatientThirdPartyRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  number?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  creation_date?: string;

  @ApiProperty()
  third_party_amount?: number;

  @ApiProperty()
  third_party_amount_paid?: number;

  @ApiProperty()
  tiers_payant_status?: string;

  @ApiProperty()
  patient?: ThirdPartyPatientRes;

  @ApiProperty()
  third_party_amc?: ThirdPartyAmcRes;

  @ApiProperty()
  third_party_amo?: ThirdPartyAmoRes;
}

export class CaresheetRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  usrId?: number;

  @ApiProperty()
  conId?: number;

  @ApiProperty()
  fseStatusId?: number;

  @ApiProperty()
  dreStatusId?: number;

  @ApiProperty()
  amoId?: number;

  @ApiProperty()
  amcId?: number;

  @ApiProperty()
  numeroFacturation?: string;

  @ApiProperty()
  nbr?: string;

  @ApiProperty()
  date?: string;

  @ApiProperty()
  mode?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  electronicCaresheet?: boolean;

  @ApiProperty()
  tiersPayant?: boolean;

  @ApiProperty()
  tiersPayantStatus?: boolean;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  thirdPartyAmount?: number;

  @ApiProperty()
  thirdPartyAmountPaid?: number;

  @ApiProperty()
  amountAMO?: number;

  @ApiProperty()
  amountAMC?: number;

  @ApiProperty()
  amountAssure?: number;

  @ApiProperty()
  externalReferenceId?: number;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}

export class CaresheetThirdPartyRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  mode?: string;

  @ApiProperty()
  mode_readable?: string;

  @ApiProperty()
  number?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  type_readable?: string;

  @ApiProperty()
  tiers_payant?: boolean;

  @ApiProperty()
  tiers_payant_status?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  amount_amc?: number;

  @ApiProperty()
  amount_amo?: number;

  @ApiProperty()
  amount_patient?: number;

  @ApiProperty()
  creation_date?: string;

  @ApiProperty()
  electronic_caresheet?: boolean;

  @ApiProperty()
  third_party_amount?: number;

  @ApiProperty()
  third_party_amount_paid?: number;

  @ApiProperty()
  third_party_amount_remaining?: number;

  @ApiProperty()
  lots?: LotEntity[];

  @ApiProperty()
  rejections?: CaresheetRejectionEntity[];

  @ApiProperty()
  fse_status?: CaresheetStatusEntity;

  @ApiProperty()
  third_party_amc?: CaresheetThirdPartyAmcRes;

  @ApiProperty()
  third_party_amo?: CaresheetThirdPartyAmoRes;

  @ApiProperty()
  patient?: CaresheetPatientRes;
}

export class CaresheetThirdPartyAmcRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  is_dre?: boolean;

  @ApiProperty()
  status?: EnumThirdPartyStatus;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  amount_care?: number;

  @ApiProperty()
  amount_care_paid?: number;

  @ApiProperty()
  amount_care_remaining?: number;

  @ApiProperty()
  amount_paid?: number;

  @ApiProperty()
  amount_paid_manually?: number;

  @ApiProperty()
  amount_paid_noemie?: number;

  @ApiProperty()
  amount_prosthesis?: number;

  @ApiProperty()
  amount_prosthesis_paid?: number;

  @ApiProperty()
  amount_prosthesis_remaining?: number;

  @ApiProperty()
  amount_remaining?: number;

  @ApiProperty()
  amc?: CaresheetAmcRes;
}

export class CaresheetAmcRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  is_gu?: boolean;

  @ApiProperty()
  libelle?: string;

  @ApiProperty()
  numero?: string;
}

export class CaresheetThirdPartyAmoRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  is_dre?: boolean;

  @ApiProperty()
  status?: EnumThirdPartyStatus;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  amount_care?: number;

  @ApiProperty()
  amount_care_paid?: number;

  @ApiProperty()
  amount_care_remaining?: number;

  @ApiProperty()
  amount_paid?: number;

  @ApiProperty()
  amount_paid_manually?: number;

  @ApiProperty()
  amount_paid_noemie?: number;

  @ApiProperty()
  amount_prosthesis?: number;

  @ApiProperty()
  amount_prosthesis_paid?: number;

  @ApiProperty()
  amount_prosthesis_remaining?: number;

  @ApiProperty()
  amount_remaining?: number;

  @ApiProperty()
  amo?: CaresheetAmoRes;
}

export class CaresheetAmoRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  libelle?: string;

  @ApiProperty()
  numero?: string;

  @ApiProperty()
  caisse_gestionnaire?: string;

  @ApiProperty()
  centre_gestionnaire?: string;

  @ApiProperty()
  centre_informatique?: string;

  @ApiProperty()
  code_national?: string;

  @ApiProperty()
  grand_regime?: string;

  @ApiProperty()
  organisme_destinataire?: string;
}

export class CaresheetPatientRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  first_name?: string;

  @ApiProperty()
  last_name?: string;

  @ApiProperty()
  full_name?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  birth_rank?: number;

  @ApiProperty()
  number?: number;

  @ApiProperty()
  amcs?: PatientAmcEntity[];

  @ApiProperty()
  amos?: PatientAmoEntity[];

  @ApiProperty()
  patient_users?: ContactUserEntity[];

  @ApiProperty()
  phone_numbers?: PhoneEntity[];
}

export class CaresheetStatusRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  value?: number;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  description?: string;
}
