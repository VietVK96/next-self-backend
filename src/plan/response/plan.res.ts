import { ApiProperty } from '@nestjs/swagger';
import { PaymentItemRes } from 'src/payment-schedule/response/payment.res';

export class FindAllPlanItemRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  acceptedAt?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  createdAt?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  payment_schedule?: string;

  @ApiProperty()
  sending_date_to_patient?: string;

  @ApiProperty()
  sent_to_patient?: string;

  @ApiProperty()
  updated_at?: string;
}

export class FindAllPlanRes {
  @ApiProperty()
  data?: FindAllPlanItemRes[];

  @ApiProperty()
  draw?: string;

  @ApiProperty()
  recordsFiltered?: number;

  @ApiProperty()
  recordsTotal?: number;
}

export class findOnePlanRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  user_id?: number;

  @ApiProperty()
  patient_id?: number;

  @ApiProperty()
  payment_schedule_id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  mutualCeiling?: number;

  @ApiProperty()
  amount_repaid?: number;

  @ApiProperty()
  amount_to_be_paid?: number;

  @ApiProperty()
  acceptedOn?: Date;

  @ApiProperty()
  bill_id?: number;

  @ApiProperty()
  quote_id?: number;

  @ApiProperty()
  quote_template?: number;

  @ApiProperty()
  displayBill?: boolean;

  @ApiProperty()
  bill?: PlanBill;

  @ApiProperty()
  quotation?: PlanQuotation;

  @ApiProperty()
  events?: PlanEvent[];

  @ApiProperty()
  payment_schedule?: PaymentItemRes;
}

export class PlanBill {
  @ApiProperty()
  id?: number;
}

export class PlanQuotation {
  id?: number;
  template?: number;
  link?: QoutationLink;
}

export class QoutationLink {
  print?: number;
  email?: number;
}

export class PlanEvent {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  color?: PlanEventColor;

  @ApiProperty()
  start?: Date;

  @ApiProperty()
  end?: Date;

  @ApiProperty()
  tasks: PlanEventTask[];

  @ApiProperty()
  user: EventUser;

  @ApiProperty()
  plan: EventPlan;

  @ApiProperty()
  event_type: EventType;
}

export class EventUser {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  displayName?: string;
}

export class EventPlan {
  @ApiProperty()
  pos?: number;

  @ApiProperty()
  duration?: Date;

  @ApiProperty()
  delay?: number;
}

export class EventType {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  label?: string;
}

export class PlanEventTask {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  library_act_id?: number;

  @ApiProperty()
  library_act_quantity_id?: number;

  @ApiProperty()
  parent_id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  pos?: number;

  @ApiProperty()
  duration?: Date;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  qty?: number;

  @ApiProperty()
  state?: number;

  @ApiProperty()
  ccam_family?: string;

  @ApiProperty()
  dental?: PlanEventTaskDental;
}
export class PlanEventTaskDental {
  @ApiProperty()
  teeth?: string[];
  @ApiProperty()
  type?: string;
  @ApiProperty()
  coef?: number;
  @ApiProperty()
  exceeding?: string;
  @ApiProperty()
  exceptional_refund?: number;
  @ApiProperty()
  code?: string;
  @ApiProperty()
  comp?: string;
  @ApiProperty()
  purchasePrice?: number;
  @ApiProperty()
  ccam_id?: number;
  @ApiProperty()
  ngap_key_id?: number;
  @ApiProperty()
  dental_material_id?: number;

  @ApiProperty()
  ccamCode?: string;
  @ApiProperty()
  ccamOpposable?: number;
  @ApiProperty()
  ccamNPC?: number;
  @ApiProperty()
  ccamNR?: number;
  @ApiProperty()
  ccamTelem?: number;
  @ApiProperty()
  ccamModifier?: string;
  @ApiProperty()
  secuAmount?: number;
  @ApiProperty()
  secuRepayment?: number;
  @ApiProperty()
  mutualRepaymentType?: number;
  @ApiProperty()
  mutualRepaymentRate?: number;
  @ApiProperty()
  mutualRepayment?: number;
  @ApiProperty()
  mutualComplement?: number;
  @ApiProperty()
  personRepayment?: number;
  @ApiProperty()
  personAmount?: number;
  @ApiProperty()
  ccam?: TaskCcam;
}

export class TaskCcam {
  @ApiProperty()
  family?: CcamFamily;
}

export class CcamFamily {
  @ApiProperty()
  panier?: CcamFamilyPanier;
}

export class CcamFamilyPanier {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  code?: string;
  @ApiProperty()
  label?: string;
  @ApiProperty()
  color?: string;
}
export class EventData {
  @ApiProperty()
  plv_pos?: number;

  @ApiProperty()
  plv_duration?: Date;

  @ApiProperty()
  plv_delay?: number;

  @ApiProperty()
  id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  color?: PlanEventColor;

  @ApiProperty()
  start?: Date;

  @ApiProperty()
  end?: Date;

  @ApiProperty()
  usr_id?: number;

  @ApiProperty()
  usr_display_name?: string;

  @ApiProperty()
  event_type_id?: number;

  @ApiProperty()
  event_type_label?: string;
}

export class TaskData {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  library_act_id?: number;

  @ApiProperty()
  library_act_quantity_id?: number;

  @ApiProperty()
  parent_id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  pos?: number;

  @ApiProperty()
  duration?: Date;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  qty?: number;

  @ApiProperty()
  state?: number;

  @ApiProperty()
  ccam_family?: string;

  @ApiProperty()
  dental_id?: number;

  @ApiProperty()
  ccam_id?: number;

  @ApiProperty()
  ngap_key_id?: number;

  @ApiProperty()
  dental_material_id?: number;

  @ApiProperty()
  dental_teeth?: string;

  @ApiProperty()
  dental_type?: string;

  @ApiProperty()
  dental_coef?: number;

  @ApiProperty()
  dental_exceeding?: string;

  @ApiProperty()
  exceptional_refund?: number;

  @ApiProperty()
  dental_code?: string;

  @ApiProperty()
  dental_comp?: string;

  @ApiProperty()
  dental_purchase_price?: number;

  @ApiProperty()
  ccamCode?: string;

  @ApiProperty()
  ccamOpposable?: number;

  @ApiProperty()
  ccamNPC?: number;

  @ApiProperty()
  ccamNR?: number;

  @ApiProperty()
  ccamTelem?: number;

  @ApiProperty()
  ccamModifier?: string;

  @ApiProperty()
  secuAmount?: number;

  @ApiProperty()
  secuRepayment?: number;

  @ApiProperty()
  mutualRepaymentType?: number;

  @ApiProperty()
  mutualRepaymentRate?: number;

  @ApiProperty()
  mutualRepayment?: number;

  @ApiProperty()
  mutualComplement?: number;

  @ApiProperty()
  personRepayment?: number;

  @ApiProperty()
  personAmount?: number;

  @ApiProperty()
  ccam_panier_id?: number;

  @ApiProperty()
  ccam_panier_code?: string;

  @ApiProperty()
  ccam_panier_label?: string;

  @ApiProperty()
  ccam_panier_color?: string;
}

export class PlanEventColor {
  @ApiProperty()
  background?: string;

  @ApiProperty()
  foreground?: string;
}
