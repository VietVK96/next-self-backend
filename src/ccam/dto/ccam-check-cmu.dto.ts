import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseJson } from 'src/common/util/json';

export class CcamCheckCmuDto {
  @ApiProperty()
  @Transform(({ value }) => {
    let nValue = value;
    if (typeof value === 'string') {
      nValue = parseJson<number>(value);
    }
    const reValue: number[] = [];
    if (nValue && nValue.length > 0) {
      for (const v of nValue) {
        const n = parseInt(v);
        if (!isNaN(n)) {
          reValue.push(n);
        }
      }
    }
    return reValue;
  })
  teeth_numbers?: number[];
}
