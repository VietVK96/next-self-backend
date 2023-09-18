import { ApiProperty } from '@nestjs/swagger';

export class CreateImageSoftwareQueryDto {
  @ApiProperty()
  imaging_software?: string;

  @ApiProperty()
  workstationId?: number;
}

export class CreateImageSoftwareDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  executablePath?: string;

  @ApiProperty()
  configurationFilePath?: string;

  @ApiProperty()
  imageDirname?: string;

  @ApiProperty()
  imageBasenamePrefix?: string;

  @ApiProperty()
  imageBasenameLength?: number;

  @ApiProperty()
  computerName?: string;
}

export class ImageSoftwareDto {
  @ApiProperty()
  computerName?: string | boolean;

  @ApiProperty()
  radios?: string;
}
