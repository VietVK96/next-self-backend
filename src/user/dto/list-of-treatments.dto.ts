import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseJson } from 'src/common/util/json';

@ApiExtraModels()
export class FindAllConditionsDto {
  @ApiProperty({
    name: '[field]',
    required: false,
  })
  field?: string;

  @ApiProperty({
    name: '[op]',
    required: false,
  })
  op?: string;

  @ApiProperty({
    name: '[value]',
    required: false,
  })
  value?: string;
}

export class ListOfTreatmentsFindAllDto {
  @ApiProperty({ example: 1 })
  page?: number;

  @ApiProperty({ example: 100 })
  rp?: number;

  @ApiProperty({ required: false })
  sortname?: string;

  @ApiProperty({ required: false })
  sortorder?: string;

  @ApiProperty({
    isArray: true,
    example: '{"field": "lastname", "op": "like", "value": "sd"}',
    type: FindAllConditionsDto,
    required: false,
  })
  @Transform(({ value }) => {
    let re: FindAllConditionsDto[] | undefined = undefined;
    if (value) {
      re = [];
      if (Array.isArray(value) && value.length > 0) {
        for (const v of value) {
          let d = v;
          if (typeof v === 'string') {
            d = parseJson<FindAllConditionsDto>(v);
          }
          re.push(d);
        }
      } else {
        re.push(parseJson<FindAllConditionsDto>(value));
      }
    }
    return re;
  })
  conditions?: FindAllConditionsDto[];
}
