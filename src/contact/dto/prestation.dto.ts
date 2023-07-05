import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class PrestationDto {
  @ApiProperty({
    name: 'id',
    required: false,
  })
  id?: number;

  @ApiProperty({
    name: 'ald',
    required: false,
  })
  ald?: number;

  @ApiProperty({
    name: 'amount',
    required: false,
  })
  amount?: number;

  @ApiProperty({
    name: 'caresheetId',
    required: false,
  })
  caresheetId?: number;

  @ApiProperty({
    name: 'ccamCode',
    required: false,
  })
  ccamCode?: string;

  @ApiProperty({
    name: 'ccamModifier',
    required: false,
  })
  ccamModifier?: string;

  @ApiProperty({
    name: 'ccamOpposable',
    required: false,
  })
  ccamOpposable?: number;

  @ApiProperty({
    name: 'ccamTelem',
    required: false,
  })
  ccamTelem?: number;

  @ApiProperty({
    name: 'ccam_code',
    required: false,
  })
  ccam_code?: string;

  @ApiProperty({
    name: 'ccam_family',
    required: false,
  })
  ccamFamily?: string;

  @ApiProperty({
    name: 'ccam_id',
    required: false,
  })
  ccamId?: number;

  @ApiProperty({
    name: 'ccam_repayable_on_condition',
    required: false,
  })
  ccamRepayableOnCondition?: number;

  @ApiProperty({
    name: 'code',
    required: false,
  })
  code?: number;

  @ApiProperty({
    name: 'coef',
    required: false,
  })
  coef?: string;

  @ApiProperty({
    name: 'color',
    required: false,
  })
  color?: number;

  @ApiProperty({
    name: 'comp',
    required: false,
  })
  comp?: string;

  @ApiProperty({
    name: 'contactId',
    required: false,
  })
  contactId?: string;

  @ApiProperty({
    name: 'cotation',
    required: false,
  })
  cotation?: string;

  @ApiProperty({
    name: 'date',
    required: false,
  })
  date?: Date;

  @ApiProperty({
    name: 'duration',
    required: false,
  })
  duration?: string;

  @ApiProperty({
    name: 'eventId',
    required: false,
  })
  eventId?: number;

  @ApiProperty({
    name: 'exceeding',
    required: false,
  })
  exceeding?: string;

  @ApiProperty({
    name: 'exception',
    required: false,
  })
  exception?: boolean;

  @ApiProperty({
    name: 'exceptional_refund',
    required: false,
  })
  exceptionalRefund?: number;

  @ApiProperty({
    name: 'exemption_code',
    required: false,
  })
  exemptionCode?: string;

  @ApiProperty({
    name: 'msg',
    required: false,
  })
  msg?: string;

  @ApiProperty({
    name: 'mutualComplement',
    required: false,
  })
  mutualComplement?: string;

  @ApiProperty({
    name: 'mutualRepayment',
    required: false,
  })
  mutualRepayment?: string;

  @ApiProperty({
    name: 'mutualRepaymentRate',
    required: false,
  })
  mutualRepaymentRate?: string;

  @ApiProperty({
    name: 'mutualRepaymentType',
    required: false,
  })
  mutualRepaymentType?: number;

  @ApiProperty({
    name: 'name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    name: 'ngap_key_id',
    required: false,
  })
  ngapKeyId?: number;

  @ApiProperty({
    name: 'nomenclature',
    required: false,
  })
  nomenclature?: string;

  @ApiProperty({
    name: 'personAmount',
    required: false,
  })
  personAmount?: string;

  @ApiProperty({
    name: 'personRepayment',
    required: false,
  })
  personRepayment?: string;

  @ApiProperty({
    name: 'pos',
    required: false,
  })
  pos?: number;

  @ApiProperty({
    name: 'practitionerAbbr',
    required: false,
  })
  practitionerAbbr?: string;

  @ApiProperty({
    name: 'practitionerFirstname',
    required: false,
  })
  practitionerFirstname?: string;

  @ApiProperty({
    name: 'practitionerId',
    required: false,
  })
  practitionerId?: number;

  @ApiProperty({
    name: 'practitionerLastname',
    required: false,
  })
  practitionerLastname?: string;

  @ApiProperty({
    name: 'purchasePrice',
    required: false,
  })
  purchasePrice?: string;

  @ApiProperty({
    name: 'qty',
    required: false,
  })
  qty?: number;

  @ApiProperty({
    name: 'secuAmount',
    required: false,
  })
  secuAmount?: string;

  @ApiProperty({
    name: 'secuRepayment',
    required: false,
  })
  secuRepayment?: string;

  @ApiProperty({
    name: 'selected',
    required: false,
  })
  selected?: boolean;

  @ApiProperty({
    name: 'state',
    required: false,
  })
  state?: number;

  @ApiProperty({
    name: 'teeth',
    required: false,
  })
  teeth?: string;

  @ApiProperty({
    name: 'traceability_status',
    required: false,
  })
  traceabilityStatus?: number;

  @ApiProperty({
    name: 'type',
    required: false,
  })
  type?: string;

  @ApiProperty({
    name: 'medical',
    required: false,
  })
  medical?: Medical[];
}

export class Medical {
  @ApiProperty({
    name: 'ald',
    required: false,
  })
  ald?: boolean;
}
