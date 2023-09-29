import { ApiProperty } from '@nestjs/swagger';

export class ParametersJuxtalinkRes {
  @ApiProperty()
  pathExeOds: string;

  @ApiProperty()
  nameExe: string;

  @ApiProperty()
  parametersExe: string;
  @ApiProperty()
  pathFileOds?: string;
  @ApiProperty()
  nameFile?: string;
  @ApiProperty()
  contenu?: string;
  @ApiProperty()
  clipboardText?: string;
}

export class JuxtalinkRes {
  @ApiProperty()
  token: string;

  @ApiProperty()
  plugin: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  version?: string;

  @ApiProperty()
  plageDePorts: string;

  @ApiProperty()
  drcDownloadPopup: number;

  @ApiProperty()
  juxtalinkDownloadPopup: number;

  @ApiProperty()
  applicationUrl: string;

  @ApiProperty()
  parameters: ParametersJuxtalinkRes;
}
