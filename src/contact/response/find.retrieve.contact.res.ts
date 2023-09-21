import { AddressEntity } from 'src/entities/address.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { UserEntity } from 'src/entities/user.entity';

export class FindRetrieveRes {
  id?: number;
  nbr?: number;
  lastname?: string;
  lastNamePhonetic?: string;
  firstname?: string;
  firstNamePhonetic?: string;
  profession?: string;
  email?: string;
  birthday?: string;
  birthDateLunar?: string;
  birthOrder?: number;
  quality?: number;
  breastfeeding?: number;
  pregnancy?: number;
  clearanceCreatinine?: number;
  hepaticInsufficiency?: string;
  weight?: number;
  size?: number;
  conMedecinTraitantId?: number;
  msg?: string;
  odontogramObservation?: string;
  notificationMsg?: string;
  notificationEnable?: number;
  notificationEveryTime?: number;
  color?: number;
  colorMedical?: number;
  insee?: string;
  inseeKey?: string;
  socialSecurityReimbursementRate?: number;
  mutualRepaymentType?: number;
  mutualRepaymentRate?: number;
  mutualComplement?: number;
  mutualCeiling?: number;
  agenesie?: number;
  maladieRare?: number;
  rxSidexisLoaded?: number;
  externalReferenceId?: number;
  reminderVisitType?: string;
  reminderVisitDuration?: number;
  reminderVisitDate?: string;
  reminderVisitLastDate?: string;
  delete?: number;
  organizationId?: number;
  genId?: number;
  adrId?: number;
  uplId?: number;
  cpdId?: number;
  cofId?: number;
  ursId?: number;
  createdAt?: DateTime;
  updatedAt?: DateTime;
  deletedAt?: DateTime;
  gender?: Gender;
  user?: UserEntity;
  address?: AddressEntity;
  phones?: PhoneEntity[];
  family?: any;
  addressed_by?: ResRetrieve;
  doctor?: ResRetrieve;
  amountDue?: boolean;
  reliability?: Reliability;
  avatarId?: number;
  avatarToken?: string;
}

class DateTime {
  date?: Date;
  timezone_type?: number;
  timezone?: string;
}

class Gender {
  id?: number;
  name?: string;
  longName?: string;
  type?: string;
}

class Reliability {
  total?: number;
  value?: number;
  low?: number;
  high?: number;
  max?: number;
}

class ResRetrieve {
  id?: number;
  first_name?: string;
  last_name?: string;
}
