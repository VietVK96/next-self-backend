import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class SavePatientDto {
  @ApiProperty({
    required: false,
  })
  addressCity?: string;

  @ApiProperty({
    required: false,
  })
  addressCountry?: string;

  @ApiProperty({
    required: false,
  })
  addressCountryAbbr?: string;

  @ApiProperty({
    required: false,
  })
  addressId?: string;

  @ApiProperty({
    required: false,
  })
  addressStreet?: string;

  @ApiProperty({
    required: false,
  })
  addressStreetComp?: string;

  @ApiProperty({
    required: false,
  })
  addressZipCode?: string;

  @ApiProperty({
    required: false,
  })
  addressed_by?: {
    id?: string;
  };

  @ApiProperty({
    required: false,
  })
  age?: number;

  @ApiProperty({
    required: false,
  })
  agenesie?: number;

  @ApiProperty({
    required: false,
  })
  amcs?: string[];

  @ApiProperty({
    required: false,
  })
  amos?: string[];

  @ApiProperty()
  amountDue?: number;

  @ApiProperty()
  amountDueCare?: number;

  @ApiProperty()
  avatarToken?: string;

  @ApiProperty()
  avatarUrl?: string;

  @ApiProperty()
  amountDueProsthesis?: number;

  @ApiProperty()
  avatarId?: number;

  @ApiProperty({
    required: false,
  })
  birthOrder?: number;

  @ApiProperty({
    required: false,
  })
  birthday?: string;

  @ApiProperty({
    required: false,
  })
  breastfeeding?: number;

  @ApiProperty({
    required: false,
  })
  clearanceCreatinine?: string;

  @ApiProperty({
    required: false,
  })
  color?: string;

  @ApiProperty({
    required: false,
  })
  colorBackgroundHex?: string;

  @ApiProperty({
    required: false,
  })
  colorMedical?: number;

  @ApiProperty({
    required: false,
  })
  colorMedicalBackgroundHex?: string;

  @ApiProperty({
    required: false,
  })
  colorMedicalTextHex?: string;

  @ApiProperty()
  contactFamilyId?: number;

  @ApiProperty({
    required: false,
  })
  colorTextHex?: string;

  @ApiProperty({
    required: false,
  })
  doctor?: {
    id?: string;
  };

  @ApiProperty({
    required: false,
  })
  email?: string;

  @ApiProperty()
  external_reference_id?: number;

  @ApiProperty()
  document_count?: number;

  @ApiProperty({
    required: false,
  })
  firstname?: string;

  @ApiProperty({
    required: false,
  })
  genderId?: string;

  @ApiProperty({
    required: false,
  })
  hepaticInsufficiency?: string;

  @ApiProperty()
  genderName?: string;

  @ApiProperty()
  genderType?: string;

  @ApiProperty({
    required: false,
  })
  id?: number;

  @ApiProperty({
    required: false,
  })
  insee?: string;

  @ApiProperty()
  image_count?: number;

  @ApiProperty()
  image_library_link?: string;

  @ApiProperty({
    required: false,
  })
  inseeKey?: string;

  @ApiProperty({
    required: false,
  })
  lastname?: string;

  @ApiProperty({
    required: false,
  })
  maladieRare?: number;

  @ApiProperty({
    required: false,
  })
  medical?: {
    policy_holder?: {
      insee_number?: string;
      name?: string;
      patient?: {
        id?: number;
      };
    };
    tariff_type?: {
      id?: string;
    };
  };

  @ApiProperty({
    required: false,
  })
  members?: string[];

  @ApiProperty({
    required: false,
  })
  msg?: string;

  @ApiProperty({
    required: false,
  })
  mutualCeiling?: string;

  @ApiProperty({
    required: false,
  })
  mutualComplement?: string;

  @ApiProperty({
    required: false,
  })
  mutualRepaymentRate?: string;

  @ApiProperty({
    required: false,
  })
  mutualRepaymentType?: string;

  @ApiProperty({
    required: false,
  })
  nbr?: number;

  @ApiProperty({
    required: false,
  })
  notification?: string;

  @ApiProperty({
    required: false,
  })
  notificationEnable?: number;

  @ApiProperty({
    required: false,
  })
  notificationEveryTime?: number;

  @ApiProperty({
    required: false,
  })
  notificationMsg?: string;

  @ApiProperty({
    required: false,
  })
  practitionerAbbr?: string;

  @ApiProperty({
    required: false,
  })
  odontogram_observation?: string;

  @ApiProperty({
    required: false,
  })
  phones?: {
    id?: number;
    nbr?: string;
    phoneTypeId?: number;
    phoneTypeName?: string;
    type?: {
      id?: number;
    };
  }[];

  @ApiProperty({
    required: false,
  })
  practitionerId?: string;

  @ApiProperty({
    required: false,
  })
  pregnancy?: string;

  @ApiProperty({
    required: false,
  })
  profession?: string;

  @ApiProperty({
    required: false,
  })
  quality?: string;

  @ApiProperty({
    required: false,
  })
  reminderVisitDate?: string;

  @ApiProperty({
    required: false,
  })
  reminderVisitDuration?: string;

  @ApiProperty({
    required: false,
  })
  reminderVisitType?: string;

  @ApiProperty({
    required: false,
  })
  rxSidexisLoaded?: number;

  @ApiProperty({
    required: false,
  })
  size?: string;

  @ApiProperty({
    required: false,
  })
  social_security_reimbursement_rate?: string;

  @ApiProperty({
    required: false,
  })
  weight?: string;

  @ApiProperty()
  lastPayment?: string;

  @ApiProperty()
  lastCare?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  qualityName?: string;

  @ApiProperty()
  reminderVisitLastDate?: string;

  @ApiProperty()
  third_party_balance?: number;
}
