import { ApiProperty } from '@nestjs/swagger';

export class MailInputsDto {
  header: {
    height: number;
    body: string;
  };
  footer: {
    height: number;
    body: string;
  };
  footer_content: {
    height: number;
    body: string;
  };
  body: string;
}

export class MailOptionsDto {
  preview: boolean;
}

export class UpdateMailDto {
  @ApiProperty()
  type?: string;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  body?: string;

  @ApiProperty()
  footer_content?: string;

  @ApiProperty()
  footer_height?: number;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  favorite?: number;

  @ApiProperty()
  created_at?: Date;

  @ApiProperty()
  updated_at?: Date;

  @ApiProperty()
  header?: {
    id?: number;
  };

  @ApiProperty()
  footer?: {
    id?: number;
  };
  id?: number;
}

export class MailPayloadDto {
  id?: number;
  updateMailDto: UpdateMailDto;
}
