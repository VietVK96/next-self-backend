import { ApiProperty } from '@nestjs/swagger';

export class UserResourceRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  doctorId?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerName?: string;

  @ApiProperty()
  use_default_color?: boolean;
}

export class UserPractitionersRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  admin?: number;

  @ApiProperty()
  abbr?: string;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  phoneHome?: string;

  @ApiProperty()
  phoneMobile?: string;

  @ApiProperty()
  phoneFax?: string;

  @ApiProperty()
  agaMember?: number;

  @ApiProperty()
  droit_permanent_depassement?: number;

  @ApiProperty()
  numeroFacturant?: number;

  @ApiProperty()
  finess?: string;

  @ApiProperty()
  fluxCps?: string;

  @ApiProperty()
  rateCharges?: number;

  @ApiProperty()
  social_security_reimbursement_base_rate?: number;

  @ApiProperty()
  social_security_reimbursement_rate?: number;

  @ApiProperty()
  bcbLicense?: string;

  @ApiProperty()
  signature?: string;

  @ApiProperty()
  token?: string;

  @ApiProperty()
  permissionBilling?: number;

  @ApiProperty()
  permissionPaiement?: number;

  @ApiProperty()
  permissionAccounting?: number;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  resourceId?: number;

  @ApiProperty()
  resourceName?: string;

  @ApiProperty()
  groupId?: number;
}

export class UserUserSettingRes {
  eventTitleFormat?: Array<string>[];
  displayAllWaitingRooms?: boolean;
  printAdditionalPatientInformation?: boolean;
  activateSendingAppointmentReminders?: boolean;
}

export class UserUserPreferenceRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  language?: string;

  @ApiProperty()
  country?: string;

  @ApiProperty()
  timezone?: string;

  @ApiProperty()
  view?: string;

  @ApiProperty()
  days?: number[];

  @ApiProperty()
  weekStartDay?: number;

  @ApiProperty()
  displayHoliday?: number;

  @ApiProperty()
  displayEventTime?: number;

  @ApiProperty()
  displayLastPatients?: number;

  @ApiProperty()
  displayPractitionerCalendar?: number;

  @ApiProperty()
  enableEventPractitionerChange?: number;

  @ApiProperty()
  frequency?: number;

  @ApiProperty()
  hmd?: string;

  @ApiProperty()
  hmf?: string;

  @ApiProperty()
  had?: string;

  @ApiProperty()
  haf?: string;

  @ApiProperty()
  heightLine?: number;

  @ApiProperty()
  quotationDisplayOdontogram?: string;

  @ApiProperty()
  quotationDisplayDetails?: string;

  @ApiProperty()
  quotationDisplayTooltip?: number;

  @ApiProperty()
  quotationDisplayDuplicata?: number;

  @ApiProperty()
  quotationColor?: string;

  @ApiProperty()
  billDisplayTooltip?: number;

  @ApiProperty()
  billTemplate?: number;

  @ApiProperty()
  orderDisplayTooltip?: number;

  @ApiProperty()
  orderDuplicata?: number;

  @ApiProperty()
  orderPreprintedHeader?: number;

  @ApiProperty()
  orderPreprintedHeaderSize?: number;

  @ApiProperty()
  orderFormat?: string;

  @ApiProperty()
  orderBcbCheck?: number;

  @ApiProperty()
  themeCustom?: number;

  @ApiProperty()
  themeColor?: number;

  @ApiProperty()
  themeBgcolor?: number;

  @ApiProperty()
  themeBordercolor?: number;

  @ApiProperty()
  themeAsideBgcolor?: number;

  @ApiProperty()
  reminderVisitDuration?: number;

  @ApiProperty()
  ccamBridgeQuickentry?: number;

  @ApiProperty()
  ccam_price_list?: number;

  @ApiProperty()
  patient_care_time?: string;

  @ApiProperty()
  calendar_border_colored?: number;
}

export class UserUserEventTypeRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  position?: number;

  @ApiProperty()
  duration?: string;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  is_visible?: boolean;
}
export class UserUserRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  admins?: number;

  @ApiProperty()
  abbr?: string;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  phoneHome?: string;

  @ApiProperty()
  phoneMobile?: string;

  @ApiProperty()
  phoneFax?: string;

  @ApiProperty()
  permissionLibrary?: number;

  @ApiProperty()
  permissionPatient?: number;

  @ApiProperty()
  permission_patient_view?: number;

  @ApiProperty()
  permissionPassword?: number;

  @ApiProperty()
  permissionDelete?: number;

  @ApiProperty()
  agaMember?: number;

  @ApiProperty()
  droit_permanent_depassement?: number;

  @ApiProperty()
  numeroFacturant?: string;

  @ApiProperty()
  finess?: string;

  @ApiProperty()
  fluxCps?: string;

  @ApiProperty()
  rateCharges?: string;

  @ApiProperty()
  social_security_reimbursement_base_rate?: string;

  @ApiProperty()
  social_security_reimbursement_rate?: string;

  @ApiProperty()
  bcbLicense?: string;

  @ApiProperty()
  settings?: UserUserSettingRes;

  @ApiProperty()
  signature?: string;

  @ApiProperty()
  token?: string;

  @ApiProperty()
  organization_id?: string;

  @ApiProperty()
  preference?: UserUserPreferenceRes;

  @ApiProperty()
  eventTypes: UserUserEventTypeRes[];

  @ApiProperty()
  rppsNumber?: string;

  @ApiProperty()
  national_identifier_number: string;
}

export class SessionRes {
  @ApiProperty()
  resources?: UserResourceRes[];

  @ApiProperty()
  practitioners?: UserPractitionersRes[];

  @ApiProperty()
  user?: UserUserRes;

  @ApiProperty()
  users?: Array<UserUserRes>;
}
