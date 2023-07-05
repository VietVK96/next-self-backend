import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumDentalEventTaskComp } from 'src/entities/dental-event-task.entity';
import { ExceedingEnum } from 'src/enum/exceeding-enum.enum';

@ApiExtraModels()
export class EventTaskDto {
  @ApiProperty({
    name: 'id',
    required: false,
  })
  id?: number;

  @ApiProperty({
    name: 'user',
    required: false,
  })
  user?: number;
}

export class EventTaskPatchDto {
  @ApiProperty({
    name: 'name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    name: 'pk',
    required: false,
  })
  pk?: number;

  @ApiProperty({
    name: 'user',
    required: false,
  })
  user?: number;

  @ApiProperty({
    name: 'value',
    required: false,
  })
  value?: string | boolean | { ngap_key_id: number; coef: number };
}

export class EventTaskSaveDto {
  @ApiProperty({
    name: 'amount',
    required: false,
  })
  amount?: number;

  @ApiProperty({
    name: 'secuAmount',
    required: false,
  })
  secuAmount?: number;

  @ApiProperty({
    name: 'purchasePrice',
    required: false,
  })
  purchasePrice?: number;

  @ApiProperty({
    name: 'duration',
    required: false,
  })
  duration?: string;

  @ApiProperty({
    name: 'exceeding',
    required: false,
  })
  exceeding?: ExceedingEnum;

  @ApiProperty({
    name: 'teeth',
    required: false,
  })
  teeth?: number;

  @ApiProperty({
    name: 'pos',
    required: false,
  })
  pos?: number;

  @ApiProperty({
    name: 'coef',
    required: false,
  })
  coef?: number;

  @ApiProperty({
    name: 'type',
    required: false,
  })
  type?: string;

  @ApiProperty({
    name: 'exceptional_refund',
    required: false,
  })
  exceptional_refund?: boolean;

  @ApiProperty({
    name: 'user',
    required: false,
  })
  user?: number;

  @ApiProperty({
    name: 'contact',
    required: false,
  })
  contact?: number;

  @ApiProperty({
    name: 'ngap_key_id',
    required: false,
  })
  ngap_key_id?: number;

  @ApiProperty({
    name: 'date',
    required: false,
  })
  date?: string;

  @ApiProperty({
    name: 'name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    name: 'state',
    required: false,
  })
  state?: number;

  @ApiProperty({
    name: 'ccamId',
    required: false,
  })
  ccamId?: number;

  @ApiProperty({
    name: 'library_act_id',
    required: false,
  })
  library_act_id?: number;

  @ApiProperty({
    name: 'library_act_quantity_id',
    required: false,
  })
  library_act_quantity_id?: number;

  @ApiProperty({
    name: 'parent_id',
    required: false,
  })
  parent_id?: number;

  @ApiProperty({
    name: 'msg',
    required: false,
  })
  msg?: string;

  @ApiProperty({
    name: 'color',
    required: false,
  })
  color?: number;

  @ApiProperty({
    name: 'ccam_family',
    required: false,
  })
  ccam_family?: string;

  @ApiProperty({
    name: 'dental_material_id',
    required: false,
  })
  dental_material_id?: number;

  @ApiProperty({
    name: 'comp',
    required: false,
  })
  comp?: EnumDentalEventTaskComp;

  @ApiProperty({
    name: 'code',
    required: false,
  })
  code?: string;

  @ApiProperty({
    name: 'ccamCode',
    required: false,
  })
  ccamCode?: string;

  @ApiProperty({
    name: 'ccamOpposable',
    required: false,
  })
  ccamOpposable?: number | boolean;

  @ApiProperty({
    name: 'ccamTelem',
    required: false,
  })
  ccamTelem?: number | boolean;

  @ApiProperty({
    name: 'ccamModifier',
    required: false,
  })
  ccamModifier?: string;

  @ApiProperty({
    name: 'exemption_code',
    required: false,
  })
  exemption_code?: number;
}

// {
//   "amount": 0,
//   "secuAmount": 0,
//   "purchasePrice": 0,
//   "duration": "00:00:00",
//   "exceeding": null,
//   "teeth": 1,
//   "pos": 0,
//   "coef": 1,
//   "type": "NGAP",
//   "exceptional_refund": false,
//   "user": 1,
//   "contact": 10,
//   "ngap_key_id": 77,
//   "date": "2023-07-04",
//   "name": "HN",
//   "state": 1
// }

// {
//   "amount": 0,
//   "secuAmount": 0,
//   "purchasePrice": 0,
//   "duration": "00:00:00",
//   "exceeding": null,
//   "teeth": null,
//   "pos": 0,
//   "coef": 1,
//   "type": "NGAP",
//   "exceptional_refund": false,
//   "user": 1,
//   "contact": 10,
//   "ngap_key_id": 77,
//   "date": "2023-07-04",
//   "name": "HN",
//   "state": 0
// }
