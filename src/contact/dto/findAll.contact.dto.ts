import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseJson } from 'src/common/util/json';

@ApiExtraModels()
export class FindAllStructDto {
  @ApiProperty({
    required: false,
  })
  field?: string;

  @ApiProperty({
    required: false,
  })
  op?: string;

  @ApiProperty({
    required: false,
  })
  value?: string;
}

@ApiExtraModels(FindAllStructDto)
export class FindAllContactDto {
  @ApiProperty({
    isArray: true,
    example: '{"field": "lastname", "op": "like", "value": "sd"}',
    type: FindAllStructDto,
    required: false,
  })
  @Transform(({ value }) => {
    let re: FindAllStructDto[] | undefined = undefined;
    if (value) {
      re = [];
      if (Array.isArray(value) && value.length > 0) {
        for (const v of value) {
          const d = parseJson<FindAllStructDto>(v);
          re.push(d);
        }
      } else {
        re.push(parseJson<FindAllStructDto>(value));
      }
    }
    return re;
  })
  conditions?: FindAllStructDto[];
}
