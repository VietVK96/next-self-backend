import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class ListTreatmentRow {
  @ApiProperty()
  id?: number | null;

  @ApiProperty()
  cell: [
    string,
    string,
    { contactId?: number | string; contactNbr?: string },
    string,
    string,
    string,
    string,
    string,
    { title?: string; content?: string },
    string,
  ];
}

export class ListTreatmentRes {
  @ApiProperty()
  page?: number;

  @ApiProperty()
  total?: number;

  @ApiProperty()
  rows?: ListTreatmentRow[];

  @ApiProperty()
  customs?: { totalAmount?: string };
}
